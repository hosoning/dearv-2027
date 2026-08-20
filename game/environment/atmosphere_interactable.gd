class_name AtmosphereInteractable
extends Interactable

@export var display_name := "Home atmosphere"


func _ready() -> void:
	super._ready()
	prompt = "Set %s" % display_name.to_lower()


func interact(_actor: Node3D) -> void:
	var director := get_tree().get_first_node_in_group("day_night_director") as DayNightDirector
	AppState.open_inspector({
		"kind": "atmosphere",
		"title": display_name,
		"target": director,
		"mode": director.atmosphere_mode if director else "system",
	})
