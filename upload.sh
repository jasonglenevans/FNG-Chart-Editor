git init
git add *
git commit -m "Upload"
git rm -r --cached "node_modules"

git commit -m 'Remove the now ignored directory node_modules'
git rm -r --cached "dist"

git commit -m 'Remove the now ignored directory dist'
git branch -M main
git remote add origin https://github.com/jasonglenevans/FNG-Chart-Editor.git
git push -f origin main