use directories::UserDirs;
use image::{ImageBuffer, Rgba};
use scrap::{Capturer, Display};
use std::cmp::Reverse;
use std::fs::create_dir_all;
use std::thread;
use std::time::Duration;
use sys_info;
use sysinfo::System;
use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;

#[tauri::command]
fn get_cpu_info() -> String {
    let mut sys = System::new_all();
    sys.refresh_cpu();
    std::thread::sleep(Duration::from_secs(1));
    sys.refresh_cpu();

    let cpu_info = sys.cpus().first().unwrap();
    format!(
        "CPU: {}\nFrequência: {}\nNome: {}\nUso: {:.2}%",
        cpu_info.name(),
        cpu_info.frequency(),
        cpu_info.brand(),
        cpu_info.cpu_usage()
    )
}

#[tauri::command]
fn get_ram_info() -> String {
    let mut sys = System::new_all();
    sys.refresh_memory();

    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let free_memory = sys.free_memory();

    let free_swap = sys.free_swap();
    let used_swap = sys.used_swap();
    let total_swap = sys.total_swap();

    format!(
        "Memória Total: {} Bytes\nUsada: {} Bytes\nLivre: {} Bytes\nSwap Total: {} Bytes\nUsada: {} Bytes\nLivre: {} Bytes",
        total_memory,
        used_memory,
        free_memory,
        total_swap,
        used_swap,
        free_swap
    )
}

#[tauri::command]
fn get_running_processes() -> String {
    let mut sys = System::new_all();
    sys.refresh_processes();

    let mut processes: Vec<_> = sys
        .processes()
        .iter()
        .map(|(pid, process)| {
            (
                *pid,
                process.name().to_string(),
                process.cpu_usage(),
                process.memory() / 1024 / 1024, // Converter bytes para MB
            )
        })
        .collect();

    // Ordenar processos por uso de CPU (decrescente)
    processes.sort_by_key(|&(_, _, cpu_usage, _)| Reverse(cpu_usage as u64));

    // Pegar os top 20 processos
    let top_processes = processes.into_iter().take(20);

    let processes_info: Vec<String> = top_processes
        .map(|(pid, name, cpu_usage, memory)| {
            format!(
                "PID: {}, Nome: {}, CPU: {:.2}%, Memória: {} MB",
                pid, name, cpu_usage, memory
            )
        })
        .collect();

    processes_info.join("\n")
}

#[tauri::command]
fn get_disk_info() -> Result<String, String> {
    match sys_info::disk_info() {
        Ok(disk) => {
            let total_gb = disk.total as f64 / (1024.0 * 1024.0);
            let free_gb = disk.free as f64 / (1024.0 * 1024.0);
            let used_gb = total_gb - free_gb;
            let usage_percentage = (used_gb / total_gb) * 100.0;

            Ok(format!(
                "Espaço Total: {:.2} GB\n\
                Espaço Usado: {:.2} GB\n\
                Espaço Livre: {:.2} GB\n\
                Porcentagem de Uso: {:.2}%",
                total_gb, used_gb, free_gb, usage_percentage
            ))
        }
        Err(e) => Err(format!("Erro ao obter informações do disco: {}", e)),
    }
}

#[tauri::command]
fn capture_screen() -> bool {
    let one_hundred_ms = Duration::new(0, 100_000_000);
    let display = match Display::primary() {
        Ok(display) => display,
        Err(_) => return false,
    };
    
    let mut capturer = match Capturer::new(display) {
        Ok(capturer) => capturer,
        Err(_) => return false,
    };

    let (w, h) = (capturer.width(), capturer.height());

    let frame;
    let mut limit = 5;

    loop {
        match capturer.frame() {
            Ok(buffer) => {
                frame = buffer;
                break;
            }
            Err(_) => {
                if limit == 0 {
                    return false; 
                } else {
                    limit -= 1;
                }
                thread::sleep(one_hundred_ms);
            }
        }
    }

    let mut imgbuf = ImageBuffer::new(w as u32, h as u32);

    for (i, pixel) in imgbuf.pixels_mut().enumerate() {
        let offset = i * 4;
        *pixel = Rgba([
            frame[offset + 2], // R
            frame[offset + 1], // G
            frame[offset],     // B
            255,               // A
        ]);
    }

    let home_dir = match UserDirs::new() {
        Some(dirs) => dirs,
        None => return false,
    };
    
    let save_dir = home_dir.home_dir().join(".daijinia/screenshot");

    if let Err(e) = create_dir_all(&save_dir) {
        eprintln!("Erro ao criar diretório: {}", e);
        return false;
    }

    let path = save_dir.join("screenshot.png");

    if let Err(e) = imgbuf.save(&path) {
        eprintln!("Erro ao salvar imagem: {}", e);
        return false;
    }

    true
}


// Atualize a função run() para incluir os novos comandos
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]), /* arbitrary number of args to pass to your app */
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            app.deep_link().register_all()?;

            // app.deep_link().on_open_url(|event| {
            //     dbg!(event.urls());
            // });

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_cpu_info,
            get_ram_info,
            get_running_processes,
            get_disk_info,
            capture_screen
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
