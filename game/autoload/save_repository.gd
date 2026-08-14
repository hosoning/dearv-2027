extends Node

const LOCAL_PATH := "user://dearv_state.json"
const FLUSH_DELAY_SECONDS := 0.8

var _dirty := false
var _flush_timer: Timer


func _ready() -> void:
	_flush_timer = Timer.new()
	_flush_timer.one_shot = true
	_flush_timer.wait_time = FLUSH_DELAY_SECONDS
	_flush_timer.timeout.connect(_flush)
	add_child(_flush_timer)
	_load_local()


func queue_interaction(_object_id: String, _value: Variant) -> void:
	_dirty = true
	_flush_timer.start()


func _flush() -> void:
	if not _dirty:
		return
	_dirty = false
	var file := FileAccess.open(LOCAL_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(AppState.serialize_local_state()))
	# Cloud sync intentionally follows local persistence. The game remains usable
	# during a network interruption and the queued state can be retried safely.
	if AppState.is_signed_in() and not AppState.active_room_id.is_empty():
		var rows: Array[Dictionary] = []
		for object_id in AppState.interactions:
			rows.append({
				"room_id": AppState.active_room_id,
				"object_id": str(object_id),
				"state": {"value": AppState.interactions[object_id]},
			})
		if not rows.is_empty():
			await Supabase.upsert_rows(
				"room_runtime_state",
				rows,
				"?on_conflict=room_id,object_id"
			)


func _load_local() -> void:
	if not FileAccess.file_exists(LOCAL_PATH):
		return
	var file := FileAccess.open(LOCAL_PATH, FileAccess.READ)
	if not file:
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary:
		AppState.hydrate_local_state(parsed)
