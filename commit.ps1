# Git commit script for pathology project
Set-Location "g:\Pathology"

# Add all changes
git add -A

# Commit with message
git commit -m "feat: implement dynamic test parameters feature"

# Show log
Write-Host "Latest commit:"
git log --oneline -1

# Show status
Write-Host "`nGit status:"
git status
