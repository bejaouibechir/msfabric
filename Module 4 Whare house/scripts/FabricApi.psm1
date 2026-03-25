Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-FabricAccessToken {
    [CmdletBinding()]
    param(
        [Parameter()]
        [string] $Scope = "https://api.fabric.microsoft.com/.default",

        [Parameter()]
        [string] $TenantId
    )

    $azArgs = @("account", "get-access-token", "--scope", $Scope, "--query", "accessToken", "-o", "tsv")
    if ($TenantId) {
        $azArgs += @("--tenant", $TenantId)
    }

    $token = (& az @azArgs)
    if (-not $token) {
        throw "Impossible d'obtenir un token via Azure CLI. Vérifie `az login` puis réessaie."
    }

    return $token.Trim()
}

function Get-OneLakeStorageToken {
    [CmdletBinding()]
    param(
        [Parameter()]
        [string] $Scope = "https://storage.azure.com/.default",

        [Parameter()]
        [string] $TenantId
    )

    $azArgs = @("account", "get-access-token", "--scope", $Scope, "--query", "accessToken", "-o", "tsv")
    if ($TenantId) {
        $azArgs += @("--tenant", $TenantId)
    }

    $token = (& az @azArgs)
    if (-not $token) {
        throw "Impossible d'obtenir un token Storage via Azure CLI. Vérifie `az login` puis réessaie."
    }

    return $token.Trim()
}

function Invoke-FabricRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateSet("GET", "POST", "PATCH", "PUT", "DELETE")]
        [string] $Method,

        [Parameter(Mandatory)]
        [string] $Path,

        [Parameter()]
        [hashtable] $Query,

        [Parameter()]
        [object] $Body,

        [Parameter()]
        [string] $Token,

        [Parameter()]
        [string] $BaseUrl = "https://api.fabric.microsoft.com"
    )

    if (-not $Token) {
        $Token = Get-FabricAccessToken
    }

    $uriBuilder = [System.UriBuilder]::new("$BaseUrl$Path")
    if ($Query) {
        $pairs = foreach ($k in $Query.Keys) {
            if ($null -ne $Query[$k] -and "$($Query[$k])" -ne "") {
                "{0}={1}" -f [uri]::EscapeDataString($k), [uri]::EscapeDataString("$($Query[$k])")
            }
        }
        $uriBuilder.Query = ($pairs -join "&")
    }
    $uri = $uriBuilder.Uri.AbsoluteUri

    $headers = @{
        Authorization = "Bearer $Token"
    }

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 50
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body $json
    }

    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

function Invoke-FabricRequestWithHeaders {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateSet("GET", "POST", "PATCH", "PUT", "DELETE")]
        [string] $Method,

        [Parameter(Mandatory)]
        [string] $Path,

        [Parameter()]
        [hashtable] $Query,

        [Parameter()]
        [object] $Body,

        [Parameter()]
        [string] $Token,

        [Parameter()]
        [string] $BaseUrl = "https://api.fabric.microsoft.com"
    )

    if (-not $Token) {
        $Token = Get-FabricAccessToken
    }

    $uriBuilder = [System.UriBuilder]::new("$BaseUrl$Path")
    if ($Query) {
        $pairs = foreach ($k in $Query.Keys) {
            if ($null -ne $Query[$k] -and "$($Query[$k])" -ne "") {
                "{0}={1}" -f [uri]::EscapeDataString($k), [uri]::EscapeDataString("$($Query[$k])")
            }
        }
        $uriBuilder.Query = ($pairs -join "&")
    }
    $uri = $uriBuilder.Uri.AbsoluteUri

    $headers = @{
        Authorization = "Bearer $Token"
    }

    $respHeaders = $null
    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 50
        $data = Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body $json -ResponseHeadersVariable respHeaders -StatusCodeVariable statusCode
    } else {
        $data = Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ResponseHeadersVariable respHeaders -StatusCodeVariable statusCode
    }

    return [pscustomobject]@{
        StatusCode = $statusCode
        Headers    = $respHeaders
        Data       = $data
        Uri        = $uri
    }
}

function Get-FabricPaged {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $Path,

        [Parameter()]
        [hashtable] $Query,

        [Parameter()]
        [string] $Token
    )

    $all = @()
    $continuationToken = $null

    do {
        $q = @{}
        if ($Query) { $Query.Keys | ForEach-Object { $q[$_] = $Query[$_] } }
        if ($continuationToken) { $q["continuationToken"] = $continuationToken }

        $resp = Invoke-FabricRequest -Method GET -Path $Path -Query $q -Token $Token
        if ($resp.value) { $all += @($resp.value) }
        $continuationToken = $resp.continuationToken
    } while ($continuationToken)

    return ,$all
}

function Wait-FabricOperation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $OperationId,

        [Parameter()]
        [string] $Token,

        [Parameter()]
        [int] $TimeoutSeconds = 900
    )

    if (-not $Token) { $Token = Get-FabricAccessToken }

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $state = Invoke-FabricRequest -Method GET -Path "/v1/operations/$OperationId" -Token $Token
        if ($state.status -in @("Succeeded", "Failed", "Cancelled")) {
            if ($state.status -ne "Succeeded") {
                $err = if ($state.error) { ($state.error | ConvertTo-Json -Depth 20) } else { "" }
                throw "Operation $OperationId termine en statut '$($state.status)'. $err"
            }
            $result = Invoke-FabricRequest -Method GET -Path "/v1/operations/$OperationId/result" -Token $Token
            return $result
        }

        Start-Sleep -Seconds 10
    }

    throw "Timeout ($TimeoutSeconds s) en attendant l'operation $OperationId."
}

function New-FabricWorkspace {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $DisplayName,

        [Parameter()]
        [string] $CapacityId,

        [Parameter()]
        [string] $Description,

        [Parameter()]
        [string] $Token
    )

    $body = @{
        displayName = $DisplayName
    }
    if ($CapacityId) { $body["capacityId"] = $CapacityId }
    if ($Description) { $body["description"] = $Description }

    $resp = Invoke-FabricRequestWithHeaders -Method POST -Path "/v1/workspaces" -Body $body -Token $Token
    return $resp.Data
}

function New-FabricLakehouse {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $WorkspaceId,

        [Parameter(Mandatory)]
        [string] $DisplayName,

        [Parameter()]
        [switch] $EnableSchemas,

        [Parameter()]
        [string] $Token
    )

    $body = @{
        displayName = $DisplayName
    }
    if ($EnableSchemas) {
        $body["creationPayload"] = @{ enableSchemas = $true }
    }

    $resp = Invoke-FabricRequestWithHeaders -Method POST -Path "/v1/workspaces/$WorkspaceId/lakehouses" -Body $body -Token $Token
    if ($resp.StatusCode -eq 202) {
        $opId = $resp.Headers["x-ms-operation-id"] | Select-Object -First 1
        if (-not $opId) {
            throw "Creation lakehouse en 202 mais sans header x-ms-operation-id."
        }
        return Wait-FabricOperation -OperationId $opId -Token $Token
    }

    return $resp.Data
}

function Invoke-OneLakeDfs {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateSet("PUT", "PATCH", "GET", "HEAD", "DELETE")]
        [string] $Method,

        [Parameter(Mandatory)]
        [string] $Uri,

        [Parameter(Mandatory)]
        [string] $StorageToken,

        [Parameter()]
        [hashtable] $Headers,

        [Parameter()]
        [byte[]] $BodyBytes
    )

    $h = @{
        Authorization = "Bearer $StorageToken"
        "x-ms-version" = "2021-06-08"
    }
    if ($Headers) {
        foreach ($k in $Headers.Keys) { $h[$k] = $Headers[$k] }
    }

    if ($BodyBytes) {
        return Invoke-WebRequest -Method $Method -Uri $Uri -Headers $h -Body $BodyBytes -ContentType "application/octet-stream" -UseBasicParsing
    }
    return Invoke-WebRequest -Method $Method -Uri $Uri -Headers $h -UseBasicParsing
}

function Set-OneLakeFileFromPath {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $WorkspaceId,

        [Parameter(Mandatory)]
        [string] $ItemId,

        [Parameter(Mandatory)]
        [string] $LocalFilePath,

        [Parameter(Mandatory)]
        [string] $RemoteRelativePath,

        [Parameter(Mandatory)]
        [string] $StorageToken,

        [Parameter()]
        [int] $ChunkSizeBytes = 4194304
    )

    if (-not (Test-Path -LiteralPath $LocalFilePath)) {
        throw "Fichier introuvable: $LocalFilePath"
    }

    $remotePath = $RemoteRelativePath.TrimStart("/")
    $base = "https://onelake.dfs.fabric.microsoft.com/$WorkspaceId/$ItemId/$remotePath"

    # Ensure parent directory exists
    $parent = [System.IO.Path]::GetDirectoryName($remotePath).Replace("\\", "/")
    if ($parent) {
        $dirUri = "https://onelake.dfs.fabric.microsoft.com/$WorkspaceId/$ItemId/$parent`?resource=directory"
        try {
            Invoke-OneLakeDfs -Method PUT -Uri $dirUri -StorageToken $StorageToken | Out-Null
        } catch {
            # ignore if already exists
        }
    }

    # Create/overwrite file
    $createUri = "$base`?resource=file"
    Invoke-OneLakeDfs -Method PUT -Uri $createUri -StorageToken $StorageToken | Out-Null

    $stream = [System.IO.File]::OpenRead($LocalFilePath)
    try {
        $buffer = New-Object byte[] $ChunkSizeBytes
        $position = 0L
        while (($read = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
            $chunk = if ($read -eq $buffer.Length) { $buffer } else { $buffer[0..($read-1)] }
            $appendUri = "$base`?action=append&position=$position"
            Invoke-OneLakeDfs -Method PATCH -Uri $appendUri -StorageToken $StorageToken -BodyBytes $chunk | Out-Null
            $position += $read
        }

        $flushUri = "$base`?action=flush&position=$position"
        Invoke-OneLakeDfs -Method PATCH -Uri $flushUri -StorageToken $StorageToken | Out-Null
    } finally {
        $stream.Dispose()
    }
}

function Find-FabricWorkspace {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $DisplayName,

        [Parameter()]
        [string] $Token
    )

    $workspaces = Get-FabricPaged -Path "/v1/workspaces" -Token $Token
    $match = $workspaces | Where-Object { $_.displayName -eq $DisplayName } | Select-Object -First 1
    if (-not $match) {
        $names = ($workspaces | Select-Object -ExpandProperty displayName | Sort-Object) -join ", "
        throw "Workspace '$DisplayName' introuvable via l'API. Workspaces visibles: $names"
    }
    return $match
}

function Get-FabricWorkspaceItems {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $WorkspaceId,

        [Parameter()]
        [string] $Type,

        [Parameter()]
        [string] $Token
    )

    $query = @{}
    if ($Type) { $query["type"] = $Type }
    return Get-FabricPaged -Path "/v1/workspaces/$WorkspaceId/items" -Query $query -Token $Token
}

function Find-FabricItem {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $WorkspaceId,

        [Parameter(Mandatory)]
        [string] $DisplayName,

        [Parameter()]
        [string] $Type,

        [Parameter()]
        [string] $Token
    )

    $items = Get-FabricWorkspaceItems -WorkspaceId $WorkspaceId -Type $Type -Token $Token
    $match = $items | Where-Object { $_.displayName -eq $DisplayName } | Select-Object -First 1
    if (-not $match) {
        $hint = if ($Type) { " (type=$Type)" } else { "" }
        throw "Item '$DisplayName'$hint introuvable dans le workspace $WorkspaceId."
    }
    return $match
}

function Start-FabricPipelineRun {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $WorkspaceId,

        [Parameter(Mandatory)]
        [string] $PipelineItemId,

        [Parameter(Mandatory)]
        [string] $OwnerUpn,

        [Parameter(Mandatory)]
        [string] $OwnerObjectId,

        [Parameter()]
        [string] $Token
    )

    $path = "/v1/workspaces/$WorkspaceId/items/$PipelineItemId/jobs/instances"
    $query = @{ jobType = "Pipeline" }
    $body = @{
        executionData = @{
            pipelineName           = "pipeline"
            OwnerUserPrincipalName = $OwnerUpn
            OwnerUserObjectId      = $OwnerObjectId
        }
    }

    $resp = Invoke-FabricRequest -Method POST -Path $path -Query $query -Body $body -Token $Token
    return $resp
}

function Get-FabricPipelineRun {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $WorkspaceId,

        [Parameter(Mandatory)]
        [string] $PipelineItemId,

        [Parameter(Mandatory)]
        [string] $JobInstanceId,

        [Parameter()]
        [string] $Token
    )

    $path = "/v1/workspaces/$WorkspaceId/items/$PipelineItemId/jobs/instances/$JobInstanceId"
    return Invoke-FabricRequest -Method GET -Path $path -Token $Token
}

Export-ModuleMember -Function @(
    "Get-FabricAccessToken",
    "Get-OneLakeStorageToken",
    "Invoke-FabricRequest",
    "Invoke-FabricRequestWithHeaders",
    "Get-FabricPaged",
    "Wait-FabricOperation",
    "New-FabricWorkspace",
    "New-FabricLakehouse",
    "Invoke-OneLakeDfs",
    "Set-OneLakeFileFromPath",
    "Find-FabricWorkspace",
    "Get-FabricWorkspaceItems",
    "Find-FabricItem",
    "Start-FabricPipelineRun",
    "Get-FabricPipelineRun"
)
