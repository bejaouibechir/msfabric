Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Import-Module (Join-Path $PSScriptRoot "FabricApi.psm1") -Force

param(
    [Parameter()]
    [string] $WorkspaceDisplayName = "PL_EnergiDistrib_Test",

    [Parameter()]
    [string] $CapacityId,

    [Parameter()]
    [string] $LakehouseDisplayName = "LH_EnergiDistrib",

    [Parameter()]
    [string] $CsvFolderPath = "C:\\Users\\DELL\\Documents\\Playground\\msfabric-module4-warehouse\\data etudes de cas",

    [Parameter()]
    [string] $TenantId
)

Write-Host "Bloc 1 - Mise en place (automatique)"
Write-Host "Workspace: $WorkspaceDisplayName"
Write-Host "Lakehouse: $LakehouseDisplayName"
Write-Host "CSV folder: $CsvFolderPath"

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI (az) introuvable. Installe-le puis relance."
}

if (-not (Test-Path -LiteralPath $CsvFolderPath)) {
    throw "Dossier CSV introuvable: $CsvFolderPath"
}

$requiredFiles = @(
    "orders.csv",
    "order_lines.csv",
    "customers.csv",
    "products.csv",
    "warehouses.csv",
    "sales_reps.csv",
    "stock_levels.csv",
    "customers_update_batch2.csv"
)
foreach ($f in $requiredFiles) {
    $p = Join-Path $CsvFolderPath $f
    if (-not (Test-Path -LiteralPath $p)) {
        throw "Fichier manquant: $p"
    }
}

$fabricToken = Get-FabricAccessToken -TenantId $TenantId
$storageToken = Get-OneLakeStorageToken -TenantId $TenantId

Write-Host "Creating workspace..."
$ws = New-FabricWorkspace -DisplayName $WorkspaceDisplayName -CapacityId $CapacityId -Token $fabricToken
Write-Host "WorkspaceId: $($ws.id)"

Write-Host "Creating lakehouse..."
$lh = New-FabricLakehouse -WorkspaceId $ws.id -DisplayName $LakehouseDisplayName -EnableSchemas -Token $fabricToken

$lakehouseId = if ($lh.id) { $lh.id } elseif ($lh.itemId) { $lh.itemId } else { $null }
if (-not $lakehouseId) {
    $lakehouseId = $lh | Select-Object -ExpandProperty id -ErrorAction SilentlyContinue
}
if (-not $lakehouseId) {
    throw "Impossible de determiner l'id du lakehouse depuis la reponse: $($lh | ConvertTo-Json -Depth 10)"
}

Write-Host "LakehouseId: $lakehouseId"
Write-Host "Uploading CSVs to OneLake Files/ ..."

foreach ($f in $requiredFiles) {
    $local = Join-Path $CsvFolderPath $f
    $remote = "Files/$f"
    Write-Host " - $f"
    Set-OneLakeFileFromPath -WorkspaceId $ws.id -ItemId $lakehouseId -LocalFilePath $local -RemoteRelativePath $remote -StorageToken $storageToken
}

Write-Host "Done. Verifie dans Fabric: workspace '$WorkspaceDisplayName' -> lakehouse '$LakehouseDisplayName' -> Files/ (8 CSV)."

