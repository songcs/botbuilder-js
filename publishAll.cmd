@echo off
if "%1" neq "" goto publish
echo Must specify version
goto done

:publish
call publish botframework-schema %1
call publish botbuilder-core %1 
call publish adaptive-expressions %1
call publish botbuilder-lg %1
:done
