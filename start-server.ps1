$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:8000/")
$Listener.Start()

Write-Host "Server started at http://localhost:8000/"
Write-Host "Press Ctrl+C to stop the server"

$BasePath = $PSScriptRoot
Write-Host "Serving files from: $BasePath"

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response
        
        $RequestUrl = $Request.Url.LocalPath
        $FilePath = Join-Path $BasePath $RequestUrl.TrimStart('/')
        
        # Default to index.html for root requests
        if ($RequestUrl -eq "/") {
            $FilePath = Join-Path $BasePath "login.html"
        }
        
        Write-Host "Request: $RequestUrl -> $FilePath"
        
        if (Test-Path $FilePath -PathType Leaf) {
            $ContentType = "text/plain"
            
            # Set content type based on file extension
            switch ([System.IO.Path]::GetExtension($FilePath)) {
                ".html" { $ContentType = "text/html" }
                ".css"  { $ContentType = "text/css" }
                ".js"   { $ContentType = "application/javascript" }
                ".json" { $ContentType = "application/json" }
                ".png"  { $ContentType = "image/png" }
                ".jpg"  { $ContentType = "image/jpeg" }
                ".gif"  { $ContentType = "image/gif" }
                ".svg"  { $ContentType = "image/svg+xml" }
            }
            
            $Content = [System.IO.File]::ReadAllBytes($FilePath)
            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Content.Length
            $Response.OutputStream.Write($Content, 0, $Content.Length)
        }
        else {
            $Response.StatusCode = 404
            $NotFoundMessage = "404 - File not found"
            $Response.ContentType = "text/plain"
            $Response.ContentLength64 = $NotFoundMessage.Length
            $Writer = New-Object System.IO.StreamWriter($Response.OutputStream)
            $Writer.Write($NotFoundMessage)
            $Writer.Close()
        }
        
        $Response.Close()
    }
}
finally {
    $Listener.Stop()
}