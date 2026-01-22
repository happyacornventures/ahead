use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};
use tauri::Manager;

mod hermenia;
use hermenia::Machine;

fn node_reducer(state: Value, event: Value) -> Value {
    let mut new_state = state.clone();

    match event["type"].as_str().unwrap() {
        "node_created" => {
            new_state.as_object_mut().unwrap().insert(
                event["id"].as_str().unwrap().to_string(),
                event["payload"].clone(),
            );
            return new_state;
        }
        "node_updated" => {
            let node_id = event["payload"]["id"].as_str().unwrap().to_string();
            let mut existing_node = new_state[node_id.clone()].as_object_mut().unwrap().clone();

            if let Value::Object(payload_map) = event["payload"].clone() {
                existing_node.extend(payload_map);
            }

            new_state
                .as_object_mut()
                .unwrap()
                .insert(node_id.clone(), existing_node.into());
            return new_state;
        }
        "node_deleted" => {
            let node_id = event["payload"]["id"].as_str().unwrap().to_string();
            new_state.as_object_mut().unwrap().remove(&node_id.clone());
            return new_state;
        }
        _ => {
            println!("Unknown command: {}", event["type"].as_str().unwrap());
        }
    }
    state
}

fn edge_reducer(state: Value, event: Value) -> Value {
    let mut new_state = state.clone();

    match event["type"].as_str().unwrap() {
        "edge_created" => {
            new_state.as_object_mut().unwrap().insert(
                event["id"].as_str().unwrap().to_string(),
                event["payload"].clone(),
            );
            return new_state;
        }
        _ => {
            println!("Unknown command: {}", event["type"].as_str().unwrap());
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
            let mut listeners: Vec<Box<dyn Fn(&str, &Value, &Value) + Send + Sync>> = Vec::new();
            let reducers: HashMap<String, (Value, fn(Value, Value) -> Value)> = HashMap::from([
                (
                    "node".to_string(),
                    (json!({}), node_reducer as fn(Value, Value) -> Value),
                ),
                (
                    "edge".to_string(),
                    (json!({}), edge_reducer as fn(Value, Value) -> Value),
                ),
            ]);

            let machine = Machine::new(data, reducers, Mutex::new(std::mem::take(&mut listeners)));

            app.manage(machine);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![dispatch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
