param(
  [string]$ScriptPath = ".\public\voiceover\script.json",
  [string]$OutDir = ".\public\voiceover",
  [string]$VoiceName = "Microsoft David Desktop",
  [int]$Rate = -1,
  [int]$FromScene = 1,
  [int]$ToScene = 37
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.speech

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$script = Get-Content (Resolve-Path $ScriptPath) -Raw -Encoding UTF8 | ConvertFrom-Json
$meta = $script.meta
$scenes = $script.scenes | Where-Object { $_.id -ge $FromScene -and $_.id -le $ToScene }
$sceneDurations = @{}
$sceneStarts = @{}
$sceneCaptions = @{}
$cursorFrames = 0

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = $Rate
$voiceChosen = $false
foreach ($v in $synth.GetInstalledVoices()) {
  if ($v.VoiceInfo.Name -eq $VoiceName) { $synth.SelectVoice($VoiceName); $voiceChosen = $true; break }
}
if (-not $voiceChosen) {
  Write-Host "Voice '$VoiceName' not installed; using default: $($synth.Voice.Name)"
}
Write-Host "Using voice: $($synth.Voice.Name) (Rate=$Rate) | $($scenes.Count) scenes | -> $OutDir`n"

foreach ($scene in $scenes) {
  $padded = "{0:D2}" -f [int]$scene.id
  $wavPath = Join-Path (Resolve-Path $OutDir) "scene_$padded.wav"
  $text = [string]$scene.narration
  if ([string]::IsNullOrWhiteSpace($text)) {
    Write-Host "  • scene_$padded.wav : empty narration, KEEP silent placeholder"
    continue
  }
  try {
    $progress = [System.Collections.Generic.List[object]]::new()
    $progressHandler = [System.EventHandler[System.Speech.Synthesis.SpeakProgressEventArgs]]{
      param($sender, $eventArgs)
      $startMs = [int]$eventArgs.AudioPosition.TotalMilliseconds
      $endMs = $startMs + [math]::Max(80, [int]$eventArgs.AudioPosition.TotalMilliseconds + [int]$eventArgs.CharacterCount * 42 - $startMs)
      $wordText = [string]$eventArgs.Text
      if ($eventArgs.CharacterPosition -gt 0) { $wordText = " $wordText" }
      [void]$progress.Add([ordered]@{
        text = $wordText
        startMs = $startMs
        endMs = $endMs
        fromMs = $startMs
        toMs = $endMs
        timestampMs = $startMs
        confidence = 1
      })
    }
    $synth.add_SpeakProgress($progressHandler)
    $synth.SetOutputToWaveFile($wavPath)
    $synth.Speak($text)
    $synth.SetOutputToNull()
    $synth.remove_SpeakProgress($progressHandler)
    $bytes = [IO.File]::ReadAllBytes($wavPath)
    $sampleRate = [BitConverter]::ToUInt32($bytes, 24)
    $channels = [BitConverter]::ToUInt16($bytes, 22)
    $bitsPerSample = [BitConverter]::ToUInt16($bytes, 34)
    $dataBytes = $bytes.Length - 44
    $secExact = $dataBytes / ($sampleRate * $channels * ($bitsPerSample / 8))
    $sec = [math]::Round($secExact, 1)
    $frames = [math]::Max(150, [math]::Ceiling($secExact * $meta.fps))
    $captionArray = @($progress)
    for ($captionIndex = 0; $captionIndex -lt $captionArray.Count; $captionIndex++) {
      $caption = $captionArray[$captionIndex]
      $nextStart = if ($captionIndex + 1 -lt $captionArray.Count) {
        [int]$captionArray[$captionIndex + 1].startMs
      } else {
        [int]($secExact * 1000)
      }
      $caption.endMs = [math]::Max($caption.startMs + 40, $nextStart)
      $caption.toMs = $caption.endMs
    }
    if ($captionArray.Count -gt 0) {
      $eventEndMs = [int]$captionArray[$captionArray.Count - 1].endMs
      $captionScale = ($secExact * 1000) / [math]::Max(1, $eventEndMs)
      foreach ($caption in $captionArray) {
        $caption.startMs = [math]::Round($caption.startMs * $captionScale)
        $caption.endMs = [math]::Max($caption.startMs + 40, [math]::Round($caption.endMs * $captionScale))
        $caption.fromMs = $caption.startMs
        $caption.toMs = $caption.endMs
        $caption.timestampMs = $caption.startMs
      }
    }
    $sceneDurations[[string]$scene.id] = $frames
    $sceneStarts[[string]$scene.id] = $cursorFrames
    $sceneCaptions[[string]$scene.id] = $captionArray
    $cursorFrames += $frames
    $size = $bytes.Length
    Write-Host "  ✓ scene_$padded.wav : $($scene.title.Substring(0,[Math]::Min(42,$scene.title.Length))) — ${sec}s, $([math]::Round($size/1KB,0)) KB"
  } catch {
    if ($progressHandler) { $synth.remove_SpeakProgress($progressHandler) }
    Write-Host "  ✗ scene_$padded.wav FAILED: $($_.Exception.Message)"
  }
}
$synth.Dispose()
$timingPath = Join-Path (Resolve-Path $OutDir) "timing.json"
$timing = [ordered]@{
  fps = $meta.fps
  totalFrames = $cursorFrames
  totalSeconds = [math]::Round($cursorFrames / $meta.fps, 3)
  sceneDurations = $sceneDurations
  sceneStarts = $sceneStarts
  sceneCaptions = $sceneCaptions
}
$timing | ConvertTo-Json -Depth 8 | Set-Content -Path $timingPath -Encoding UTF8
Write-Host "Timing manifest: $timingPath"
Write-Host "`nDone. Output: $OutDir"
