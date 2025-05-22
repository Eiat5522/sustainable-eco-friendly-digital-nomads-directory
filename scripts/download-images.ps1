# Image download script for sustainable eco-friendly listings
# Reads merged_listings.json and uses its image paths to find download URLs from the $sourceImageMap

$ErrorActionPreference = "Stop"

# --- Configuration ---
$projectRoot = "d:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory"
$mergedListingsPathLocal = Join-Path $projectRoot "listings\merged_listings.json" # Renamed to avoid lint warning
$imagesBaseDestDirLocal = Join-Path $projectRoot "app-scaffold\public" # Renamed to avoid lint warning

# This map translates the relative paths found in merged_listings.json
# to actual downloadable URLs.
# YOU MUST ENSURE THIS MAP IS COMPLETE AND ACCURATE for all images referenced in merged_listings.json
$sourceImageMapLocal = @{
    "/images/listings/chiang-mai/coworking/greenhouse-cowork-main.jpg"     = "https://scontent.fbkk5-3.fna.fbcdn.net/v/t39.30808-6/343913271_222727603563055_8781863891272078367_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=5f2048&_nc_ohc=ijpPOyThjf8AX-PvBbk&_nc_ht=scontent.fbkk5-3.fna&oh=00_AfC_H1vGCVCMd9rmug24fQwSikGYikS8-g4EmPc6UR42IA&oe=65975C94";
    "/images/listings/chiang-mai/coworking/greenhouse-cowork-interior.jpg" = "https://scontent.fbkk5-5.fna.fbcdn.net/v/t39.30808-6/347263653_606107687947468_6106671759368139938_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=5f2048&_nc_ohc=6RkTIYVzQ4EAX-V9zVO&_nc_ht=scontent.fbkk5-5.fna&oh=00_AfDC7OCNNpNMcL7jakPp14FwaSSsrqPkkdxtDYBJYlwc6Q&oe=65974701";
    "/images/listings/chiang-mai/cafe/graph-cafe-main.jpg"                 = "https://lh3.googleusercontent.com/p/AF1QipMayPi2rXZe6B_zbKfqXJ9W_PzCPVs7G27ChfvQ=s1360-w1360-h1020";
    "/images/listings/chiang-mai/cafe/forest-cafe-main.jpg"                = "https://lh3.googleusercontent.com/p/AF1QipNAy5ULewU5psyKjqBrSmu_Pgl8FuQGhKsxuU3v=s1360-w1360-h1020";
    "/images/listings/chiang-mai/accommodation/eco-resort-main.jpg"        = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/279212672.jpg?k=1fc54b8b057744b875a97861ac91b3bcbedd303901dd7b8a8211caf04b227bad&o=&hp=1";
    "/images/listings/bangkok/coworking/ecoworking-space-main.jpg"         = "https://coworker.imgix.net/photos/thailand/bangkok/bangkok/the-work-loft-by-habitat-group/main.jpg?w=1200&h=800&q=90&auto=format,compress&fit=crop&mark=https%3A%2F%2Fwww.coworker.com%2Fimages%2Fwatermark.png&markscale=0";
    "/images/listings/bangkok/cafe/broccoli-revolution-main.jpg"           = "https://media-cdn.tripadvisor.com/media/photo-s/14/55/1b/6f/broccoli-revolution.jpg";
    "/images/listings/phuket/accommodation/eco-resort-phuket-main.jpg"     = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/261625462.jpg?k=ca062499bc8c4549734c576e6a1b89be6cbac18ec5580d911d1858a2e4348cae&o=&hp=1";
    # Add ALL other mappings here. Ensure each line ends with a semicolon if it's not the last one.
    # Example:
    # "/images/listings/keemala-phuket-74932/keemala-1.jpg" = "ACTUAL_DOWNLOAD_URL_FOR_KEEMALA_1.JPG";
    # "/images/listings/keemala-phuket-74932/keemala-2.jpg" = "ACTUAL_DOWNLOAD_URL_FOR_KEEMALA_2.JPG";
    # For the last item, the semicolon is optional but good practice.
    # "/images/listings/koh-lanta/coworking/coworx-recycle.png" = "https://coworx-lanta.com/wp-content/uploads/2025/04/recycle.png"
} # Closing brace for the hashtable

# --- Script Logic ---

if (-not (Test-Path -Path $mergedListingsPathLocal)) {
    Write-Error "Merged listings file not found: $mergedListingsPathLocal"
    exit 1
}

$listingsData = Get-Content -Path $mergedListingsPathLocal | ConvertFrom-Json
if (-not $listingsData) {
    Write-Warning "No data found in merged_listings.json or could not parse."
    exit 0
}

$allImageRelPaths = [System.Collections.Generic.HashSet[string]]::new()

foreach ($listing in $listingsData) {
    if ($listing.primary_image_url -and $listing.primary_image_url.Trim()) {
        $null = $allImageRelPaths.Add($listing.primary_image_url.Trim())
    }
    if ($listing.gallery_image_urls) {
        foreach ($galleryUrl in $listing.gallery_image_urls) {
            if ($galleryUrl -and $galleryUrl.Trim()) {
                $null = $allImageRelPaths.Add($galleryUrl.Trim())
            }
        }
    }
}

Write-Host "Found $($allImageRelPaths.Count) unique relative image paths to process from merged_listings.json"
$downloadCount = 0
$notFoundInMap = 0
$failedDownload = 0

foreach ($relPath in $allImageRelPaths) {
    if (-not $relPath.StartsWith("/")) {
        Write-Warning "Skipping invalid relative path (must start with '/'): $relPath"
        continue
    }

    if ($sourceImageMapLocal.ContainsKey($relPath)) {
        $downloadUrl = $sourceImageMapLocal[$relPath]
        $destinationFile = Join-Path $imagesBaseDestDirLocal $relPath.Substring(1)
        $destinationDir = Split-Path -Path $destinationFile -Parent

        Write-Host "Attempting to download: $downloadUrl"
        Write-Host "  to local relative path: $relPath"
        Write-Host "  full destination: $destinationFile"

        if (-not (Test-Path -Path $destinationDir)) {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
            Write-Host "  Created directory: $destinationDir"
        }

        try {
            Invoke-WebRequest -Uri $downloadUrl -OutFile $destinationFile -UseBasicParsing
            if (Test-Path -Path $destinationFile) {
                Write-Host "  Successfully downloaded to $destinationFile" -ForegroundColor Green
                $downloadCount++
            }
            else {
                Write-Host "  Failed to download to $destinationFile (file not found after download attempt)" -ForegroundColor Red
                $failedDownload++
            }
        }
        catch {
            Write-Host "  Error downloading $downloadUrl : $($_.Exception.Message)" -ForegroundColor Red
            $failedDownload++
        }
    }
    else {
        Write-Warning "Relative path '$relPath' not found in \$sourceImageMapLocal. Cannot download."
        $notFoundInMap++
    }
    Write-Host "" # Newline for readability
}

Write-Host "--- Image Download Summary ---"
Write-Host "Successfully downloaded: $downloadCount images"
Write-Host "Not found in source map: $notFoundInMap images"
Write-Host "Failed downloads: $failedDownload images"
Write-Host "Image download process completed!" -ForegroundColor Cyan
