# Image download script for sustainable eco-friendly listings
$imageUrls = @{
    # Chiang Mai Coworking
    "app-scaffold/public/images/listings/chiang-mai/coworking/greenhouse-cowork-main.jpg" = "https://scontent.fbkk5-3.fna.fbcdn.net/v/t39.30808-6/343913271_222727603563055_8781863891272078367_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=5f2048&_nc_ohc=ijpPOyThjf8AX-PvBbk&_nc_ht=scontent.fbkk5-3.fna&oh=00_AfC_H1vGCVCMd9rmug24fQwSikGYikS8-g4EmPc6UR42IA&oe=65975C94"
    "app-scaffold/public/images/listings/chiang-mai/coworking/greenhouse-cowork-interior.jpg" = "https://scontent.fbkk5-5.fna.fbcdn.net/v/t39.30808-6/347263653_606107687947468_6106671759368139938_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=5f2048&_nc_ohc=6RkTIYVzQ4EAX-V9zVO&_nc_ht=scontent.fbkk5-5.fna&oh=00_AfDC7OCNNpNMcL7jakPp14FwaSSsrqPkkdxtDYBJYlwc6Q&oe=65974701"
    
    # Chiang Mai Cafes
    "app-scaffold/public/images/listings/chiang-mai/cafe/graph-cafe-main.jpg" = "https://lh3.googleusercontent.com/p/AF1QipMayPi2rXZe6B_zbKfqXJ9W_PzCPVs7G27ChfvQ=s1360-w1360-h1020"
    "app-scaffold/public/images/listings/chiang-mai/cafe/forest-cafe-main.jpg" = "https://lh3.googleusercontent.com/p/AF1QipNAy5ULewU5psyKjqBrSmu_Pgl8FuQGhKsxuU3v=s1360-w1360-h1020"
    
    # Chiang Mai Accommodations
    "app-scaffold/public/images/listings/chiang-mai/accommodation/eco-resort-main.jpg" = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/279212672.jpg?k=1fc54b8b057744b875a97861ac91b3bcbedd303901dd7b8a8211caf04b227bad&o=&hp=1"
    
    # Bangkok Coworking
    "app-scaffold/public/images/listings/bangkok/coworking/ecoworking-space-main.jpg" = "https://coworker.imgix.net/photos/thailand/bangkok/bangkok/the-work-loft-by-habitat-group/main.jpg?w=1200&h=800&q=90&auto=format,compress&fit=crop&mark=https%3A%2F%2Fwww.coworker.com%2Fimages%2Fwatermark.png&markscale=0"
    
    # Bangkok Cafes
    "app-scaffold/public/images/listings/bangkok/cafe/broccoli-revolution-main.jpg" = "https://media-cdn.tripadvisor.com/media/photo-s/14/55/1b/6f/broccoli-revolution.jpg"
    
    # Phuket Accommodations
    "app-scaffold/public/images/listings/phuket/accommodation/eco-resort-phuket-main.jpg" = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/261625462.jpg?k=ca062499bc8c4549734c576e6a1b89be6cbac18ec5580d911d1858a2e4348cae&o=&hp=1"
}

# Download each image
foreach ($destination in $imageUrls.Keys) {
    $url = $imageUrls[$destination]
    Write-Host "Downloading image from $url to $destination"
    
    # Ensure directory exists
    $directory = Split-Path -Path $destination -Parent
    if (-not (Test-Path -Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    
    # Download image using curl
    curl.exe -L -o $destination $url
    
    # Check if download was successful
    if (Test-Path -Path $destination) {
        Write-Host "Successfully downloaded to $destination" -ForegroundColor Green
    } else {
        Write-Host "Failed to download to $destination" -ForegroundColor Red
    }
}

Write-Host "Image download completed!" -ForegroundColor Cyan
