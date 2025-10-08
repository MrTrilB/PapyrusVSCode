ScriptName Sample extends Quest

Import Utility

Bool Property IsReady Auto

Event OnInit()
    Debug.Trace("Sample init")
EndEvent

Function DoThing(Int amount)
    If amount > 0
        Debug.Trace("Doing thing")
    Else
        Debug.Trace("Nothing to do")
    EndIf
EndFunction
