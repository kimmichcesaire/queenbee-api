param([string]$Base = "http://localhost:3000", [string]$Instant = "2026-11-06T08:00:00Z")

function Test-Api($nom, $methode, $url, $corps) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method $methode -Body $corps -ContentType "application/json; charset=utf-8" -UseBasicParsing
    $code = $r.StatusCode; $texte = $r.Content
  } catch {
    $code = [int]$_.Exception.Response.StatusCode
    $texte = $_.ErrorDetails.Message
  }
  if ($texte.Length -gt 160) { $texte = $texte.Substring(0, 160) + "..." }
  Write-Output "$nom => $code $texte"
}

$B = "$Base/api/hives/SN-CASA-001"
Test-Api "1 hors plages  " POST "$B/measures" "{""timestamp"":""$Instant"",""weight_kg"":500,""humidity_pct"":120}"
Test-Api "2 sans corps   " POST "$B/measures" $null
Test-Api "3 limit=abc    " GET "$B/measures?limit=abc" $null
Test-Api "4 sans limit   " GET "$B/measures" $null
Test-Api "5a mesure      " POST "$B/measures" "{""timestamp"":""$Instant"",""weight_kg"":36.8}"
Test-Api "5b meme mesure " POST "$B/measures" "{""timestamp"":""$Instant"",""weight_kg"":36.8}"
$g = [guid]::NewGuid()
Test-Api "6 author_id    " POST "$B/inspections" "{""id"":""$g"",""inspected_at"":""2026-11-01T09:00:00Z"",""colony_status"":""forte"",""author_id"":""x""}"
Test-Api "7 en 2099      " POST "$B/inspections" "{""id"":""$g"",""inspected_at"":""2099-01-01T00:00:00Z"",""colony_status"":""forte""}"
