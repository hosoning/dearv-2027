class_name ServingStationInteractable
extends Interactable

@export var source_location := "induction_stove"
@export var serving_location := "dining_table"
@export var display_name := "Dining table"


func _ready() -> void:
	super._ready()
	prompt = "Serve meal at %s" % display_name.to_lower()


func interact(_actor: Node3D) -> void:
	AppState.open_inspector({
		"kind": "serving",
		"title": display_name,
		"source_location": source_location,
		"serving_location": serving_location,
		"items": Kitchen.get_prepared_food(),
	})
