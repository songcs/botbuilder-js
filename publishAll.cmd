@echo off
if "%1" neq "" goto publish
echo Must specify version
goto done

:publish
setlocal 
set Version=%1
call npm run update-versions
call publish botframework-schema %1
call publish botbuilder-core %1
call publish adaptive-expressions %1
call publish botbuilder-lg %1
:done
