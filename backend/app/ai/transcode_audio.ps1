param(
    [string]$InputPath,
    [string]$OutputPath
)

Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

try {
    $transcoder = [Windows.Media.Transcoding.MediaTranscoder]::new()
    $profile = [Windows.Media.MediaProperties.AudioEncodingProperties]::CreatePcm(16000, 1, 16)

    $inputFile = [Windows.Storage.StorageFile]::GetFileFromPathAsync($InputPath) | Await ([Windows.Storage.StorageFile])
    $outputFile = [Windows.Storage.StorageFile]::GetFileFromPathAsync($OutputPath) | Await ([Windows.Storage.StorageFile])

    $prepareResult = $transcoder.PrepareFileTranscodeAsync($inputFile, $outputFile, $profile) | Await ([Windows.Media.Transcoding.PrepareTranscodeResult])

    if ($prepareResult.CanTranscode) {
        $result = $prepareResult.TranscodeAsync() | Await ([Windows.Media.Transcoding.TranscodeFailureReason])
        Write-Output "SUCCESS"
    } else {
        Write-Output "FAIL: $($prepareResult.FailureReason)"
    }
} catch {
    Write-Output "ERROR: $_"
}
