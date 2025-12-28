use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};
use tauri::Manager;
use uuid::Uuid;

mod hermenia;
use hermenia::Machine;

fn hydrate_event(event: String, payload: &str) -> Value {
    let id = Uuid::new_v4().to_string();
    let mut event_body: Value = serde_json::from_str(payload).unwrap();

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis() as u64;

    event_body
        .as_object_mut()
        .unwrap()
        .insert("id".to_string(), json!(id));
    event_body
        .as_object_mut()
        .unwrap()
        .insert("createTime".to_string(), json!(timestamp));
    event_body
        .as_object_mut()
        .unwrap()
        .insert("type".to_string(), serde_json::Value::String(event));

    event_body
}

#[tauri::command]
fn dispatch(
    _app: tauri::AppHandle,
    event: String,
    payload: Option<String>,
    machine: tauri::State<Machine>,
) -> String {
    machine.consume(event, payload)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let data: HashMap<String, Value> = HashMap::new();
            let mut listeners: Vec<Box<dyn Fn(&str, &Value) + Send + Sync>> = Vec::new();
            let reducers: HashMap<String, (Value, fn(Value, &str, &str) -> Value)> = HashMap::new();

            let machine = Machine::new(data, reducers, Mutex::new(std::mem::take(&mut listeners)));

            app.manage(machine);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![dispatch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
