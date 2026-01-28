param(
    [string]$Message
)

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git is not available in PATH. Install Git and retry."
    exit 2
}

if (-not $Message) {
    $Message = Read-Host "Enter commit message"
}

# Stage all changes
git add .
if ($LASTEXITCODE -ne 0) { Write-Error "git add failed"; exit $LASTEXITCODE }

# Commit
git commit -m "$Message"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Nothing to commit or commit failed. If nothing to commit, you can skip pushing." -ForegroundColor Yellow
    exit $LASTEXITCODE
}

# Get current branch
$branch = git rev-parse --abbrev-ref HEAD
if ($LASTEXITCODE -ne 0) { Write-Error "failed to detect current branch"; exit $LASTEXITCODE }
$branch = $branch.Trim()

# Push and set upstream if necessary
git push -u origin $branch
if ($LASTEXITCODE -ne 0) { Write-Error "git push failed"; exit $LASTEXITCODE }

Write-Host "Committed and pushed on branch '$branch'" -ForegroundColor Green
