extends Node

signal session_changed(is_signed_in: bool)
signal interaction_state_changed(object_id: String, value: Variant)
signal inspect_requested(payload: Dictionary)
signal inspect_closed

const STATE_VERSION := 2

var access_token := ""
var refresh_token := ""
var user_id := ""
var active_room_id := ""
var interactions: Dictionary = {}
var inventory: Dictionary = {}
var prepared_food: Dictionary = {}
var is_inspecting := false


func is_signed_in() -> bool:
	return not access_token.is_empty() and not user_id.is_empty()


func set_session(session: Dictionary) -> void:
	access_token = str(session.get("access_token", ""))
	refresh_token = str(session.get("refresh_token", ""))
	var user: Dictionary = session.get("user", {})
	user_id = str(user.get("id", ""))
	session_changed.emit(is_signed_in())


func clear_session() -> void:
	access_token = ""
	refresh_token = ""
	user_id = ""
	active_room_id = ""
	interactions.clear()
	inventory.clear()
	prepared_food.clear()
	session_changed.emit(false)


func set_interaction_state(object_id: String, value: Variant, persist := true) -> void:
	interactions[object_id] = value
	interaction_state_changed.emit(object_id, value)
	if persist:
		SaveRepository.queue_interaction(object_id, value)


func get_interaction_state(object_id: String, fallback: Variant = null) -> Variant:
	return interactions.get(object_id, fallback)


func open_inspector(payload: Dictionary) -> void:
	is_inspecting = true
	inspect_requested.emit(payload)


func close_inspector() -> void:
	is_inspecting = false
	inspect_closed.emit()


func serialize_local_state() -> Dictionary:
	return {
		"version": STATE_VERSION,
		"user_id": user_id,
		"active_room_id": active_room_id,
		"interactions": interactions,
		"inventory": inventory,
		"prepared_food": prepared_food,
	}


func hydrate_local_state(payload: Dictionary) -> void:
	if int(payload.get("version", 0)) != STATE_VERSION:
		return
	active_room_id = str(payload.get("active_room_id", ""))
	interactions = payload.get("interactions", {}) as Dictionary
	inventory = payload.get("inventory", {}) as Dictionary
	prepared_food = payload.get("prepared_food", {}) as Dictionary
