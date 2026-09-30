class_name PrepStationInteractable
extends Interactable

@export var inventory_location := "counter"
@export var display_name := "Preparation counter"


func _ready() -> void:
	super._ready()
	prompt = "Use %s" % display_name.to_lower()


func interact(_actor: Node3D) -> void:
	AppState.open_inspector({
		"kind": "prep",
		"title": display_name,
		"location": inventory_location,
		"items": Kitchen.get_inventory(inventory_location),
	})
