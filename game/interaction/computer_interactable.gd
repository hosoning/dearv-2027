class_name ComputerInteractable
extends Interactable

@export var app_id := "dearv_desktop"


func _ready() -> void:
	super._ready()
	prompt = "Use computer"


func interact(_actor: Node3D) -> void:
	AppState.open_inspector({
		"kind": "computer",
		"id": object_id,
		"app_id": app_id,
		"title": "DearV Computer",
	})
