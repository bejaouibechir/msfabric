Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Import-Module (Join-Path $PSScriptRoot "FabricApi.psm1") -Force

param(
    [Parameter(Mandatory)]
    [string] $WorkspaceDisplayName,

    [Parameter()]
    [string] $LakehouseName = "LH_EnergiDistrib",

    [Parameter()]
    [string] $WarehouseName = "WH_EnergiDistrib",

    [Parameter()]
    [string] $NotebookName = "NB_Bronze_to_Silver",

    [Parameter()]
    [string] $DataflowName = "DF_EnrichOrders",

    [Parameter()]
    [string] $PipelineName = "PL_EnergiDistrib",

    [Parameter()]
    [string] $TenantId,

    [Parameter()]
    [switch] $RunPipeline,

    [Parameter()]
    [string] $OwnerUpn,

    [Parameter()]
    [string] $OwnerObjectId
)

function Write-CheckResult {
    param(
        [Parameter(Mandatory)]
        [string] $Name,
        [Parameter(Mandatory)]
        [bool] $Ok,
        [Parameter()]
        [string] $Details
    )
    $status = if ($Ok) { "PASS" } else { "FAIL" }
    if ($Details) {
        Write-Host ("[{0}] {1} - {2}" -f $status, $Name, $Details)
    } else {
        Write-Host ("[{0}] {1}" -f $status, $Name)
    }
}

$token = Get-FabricAccessToken -TenantId $TenantId

Write-Host "Fabric API validator (EnergiDistrib)"
Write-Host "Workspace: $WorkspaceDisplayName"

$ws = Find-FabricWorkspace -DisplayName $WorkspaceDisplayName -Token $token
Write-CheckResult -Name "Workspace accessible" -Ok $true -Details "$($ws.id)"

$items = Get-FabricWorkspaceItems -WorkspaceId $ws.id -Token $token

function Try-FindItem([string]$name, [string]$type) {
    try {
        $match = $items | Where-Object { $_.displayName -eq $name -and ($type -eq "" -or $_.type -eq $type) } | Select-Object -First 1
        if (-not $match) { throw "Not found" }
        Write-CheckResult -Name "$type $name" -Ok $true -Details "$($match.id)"
        return $match
    } catch {
        Write-CheckResult -Name "$type $name" -Ok $false
        return $null
    }
}

# Core items (types are per Fabric Items API)
$lh = Try-FindItem $LakehouseName "Lakehouse"
$wh = Try-FindItem $WarehouseName "Warehouse"
$nb = Try-FindItem $NotebookName "Notebook"
$df = Try-FindItem $DataflowName "Dataflow"

# Pipelines are typically DataPipeline items in Fabric
$pl = ($items | Where-Object { $_.displayName -eq $PipelineName -and ($_.type -in @("DataPipeline", "Pipeline")) } | Select-Object -First 1)
if ($pl) {
    Write-CheckResult -Name "Pipeline $PipelineName" -Ok $true -Details "$($pl.id) (type=$($pl.type))"
} else {
    Write-CheckResult -Name "Pipeline $PipelineName" -Ok $false
}

if ($RunPipeline) {
    if (-not $pl) { throw "Impossible de lancer le pipeline: item pipeline introuvable." }
    if (-not $OwnerUpn -or -not $OwnerObjectId) {
        throw "Pour -RunPipeline, fournir -OwnerUpn (email) et -OwnerObjectId (GUID Entra ID)."
    }

    Write-Host "Launching pipeline run..."
    $run = Start-FabricPipelineRun -WorkspaceId $ws.id -PipelineItemId $pl.id -OwnerUpn $OwnerUpn -OwnerObjectId $OwnerObjectId -Token $token

    $jobId = $run.id
    Write-Host "Job instance id: $jobId"

    $deadline = (Get-Date).AddMinutes(30)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 10
        $status = Get-FabricPipelineRun -WorkspaceId $ws.id -PipelineItemId $pl.id -JobInstanceId $jobId -Token $token

        $state = $status.status
        Write-Host ("Pipeline status: {0}" -f $state)

        if ($state -in @("Completed", "Succeeded", "Failed", "Cancelled")) {
            break
        }
    }
}

Write-Host "Done."

