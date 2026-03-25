param(
  [string]$BackendUrl = "https://buzinavto-calculator.onrender.com/api/v1/rate",
  [string]$FrontendUrl = "https://buzinavto-frontend.onrender.com/japan/",
  [int]$IntervalMinutes = 14,
  [switch]$RunOnce
)

$ErrorActionPreference = "Stop"

function Invoke-KeepAliveRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 90
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] OK  $($response.StatusCode)  $Url"
  } catch {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Warning "[$timestamp] FAIL $Url :: $($_.Exception.Message)"
  }
}

do {
  Invoke-KeepAliveRequest -Url $BackendUrl
  Invoke-KeepAliveRequest -Url $FrontendUrl

  if ($RunOnce) {
    break
  }

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$timestamp] Sleeping for $IntervalMinutes minute(s)..."
  Start-Sleep -Seconds ($IntervalMinutes * 60)
} while ($true)
