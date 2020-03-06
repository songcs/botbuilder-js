echo Building and publishing %1 %2
pushd libraries\%1
call npm run build
call npm publish --access public
popd
