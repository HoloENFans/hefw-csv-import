foreach ($file in Get-ChildItem *.png) {
    cwebp.exe $file.Name -o ($file.Basename + '.webp') -q 90
}
