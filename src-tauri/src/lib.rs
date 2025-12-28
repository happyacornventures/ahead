use std::collections::HashMap;
use std::sync::Mutex;

use tauri::Manager;
use serde_json::{Value};

mod hermenia;
use hermenia::{Machine};

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
      let reducers: HashMap<String, (Value, fn(Value, &str, &str) -> Value)> =
        HashMap::new();

      let machine = Machine::new(
          data,
          reducers,
          Mutex::new(std::mem::take(&mut listeners)),
      );

      app.manage(machine);

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
