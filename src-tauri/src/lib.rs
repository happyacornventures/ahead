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
    let payload_value: Value = serde_json::from_str(payload).unwrap();

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis() as u64;

    json!({
        "id": id,
        "createTime": timestamp,
        "type": event,
        "payload": payload_value
    })
}

fn node_reducer(state: Value, event: &str, payload: &str) -> Value {
    let mut new_state = state.clone();

    match event {
        "node_created" => {
            let event_body = hydrate_event(event.to_string(), payload);
            new_state
                .as_object_mut()
                .unwrap()
                .insert(event_body["id"].as_str().unwrap().to_string(), event_body["payload"].clone());
            return new_state;
        }
        "node_updated" => {
            let event_body = hydrate_event(event.to_string(), payload);
            let payload_value: Value = serde_json::from_str(payload).unwrap();
            let node_id = payload_value["id"].as_str().unwrap().to_string();
            let mut existing_node = new_state[node_id.clone()].as_object_mut().unwrap().clone();

            if let Value::Object(payload_map) = payload_value {
                existing_node.extend(payload_map);
            }

            new_state
                .as_object_mut()
                .unwrap()
                .insert(node_id.clone(), existing_node.into());
            return new_state;
        }
        "node_deleted" => {
            let event_body = hydrate_event(event.to_string(), payload);
            let payload_value: Value = serde_json::from_str(payload).unwrap();
            let node_id = payload_value["id"].as_str().unwrap().to_string();

            new_state.as_object_mut().unwrap().remove(&node_id.clone());
            return new_state;
        }
        _ => {
            println!("Unknown command: {}", event);
        }
    }
    state
}

#[tauri::command]
fn dispatch(
    _app: tauri::AppHandle,
    event: String,
    payload: Option<String>,
    machine: tauri::State<Machine>,
) -> String {
    println!("Dispatching event: {}", event);
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

            let data: HashMap<String, Value> = HashMap::from([("node".to_string(), json!({}))]);
            let mut listeners: Vec<Box<dyn Fn(&str, &Value, &str, &Value) + Send + Sync>> = Vec::new();
            let reducers: HashMap<String, (Value, fn(Value, &str, &str) -> Value)> =
                HashMap::from([(
                    "node".to_string(),
                    (json!({}), node_reducer as fn(Value, &str, &str) -> Value),
                )]);

            let machine = Machine::new(data, reducers, Mutex::new(std::mem::take(&mut listeners)));

            app.manage(machine);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![dispatch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
