import { BrowserWindow, Menu, app } from 'electron';
import { isDev, ventanaConfirmarDeleteConfigFiles } from './util.js';

//  Lógica común para personalizar el panel "Acerca de" en macOS
if (process.platform === 'darwin') {
  app.setAboutPanelOptions({
    applicationName: 'Bitura Wallet',
    applicationVersion: '1.0.0',
    copyright: '© 2025 Jorge Puentes',
    credits: 'Desarrollado por Jorge Puentes'
  });
}

// Función reutilizable para añadir el menú de la app en macOS
function getMacAppMenu(): Electron.MenuItemConstructorOptions | null {
  if (process.platform !== 'darwin') return null;

  return {
    label: app.name,
    submenu: [
      { label: 'Acerca de Bitura Wallet', role: 'about' },
      { type: 'separator' },
      { label: 'Servicios', role: 'services' },
      { type: 'separator' },
      { label: 'Ocultar Bitura Wallet', role: 'hide' },
      { label: 'Ocultar otros', role: 'hideOthers' },
      { label: 'Mostrar todo', role: 'unhide' },
      { type: 'separator' },
      { label: 'Salir de Bitura Wallet', role: 'quit' }
    ]
  };
}

// Menú Editar para macOS
function getMacEditMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    };
}

// Menú principal con todo
const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
        label: 'Archivo',
        submenu: [
            {
                id: 'frase-semilla',
                label: 'Restaurar frase semilla',
                click: () => {
                    ventanaConfirmarDeleteConfigFiles();
                }
            }
            // **SOLO DEV**
            // {
            //     label: 'Consola de desarrollador',
            //     accelerator: 'Ctrl+Shift+I',
            //     click: () => {
            //         const win = BrowserWindow.getFocusedWindow();
            //         if (win) {
            //             win.webContents.toggleDevTools();
            //         }
            //     }
            // },
            // {
            //     label: 'Recargar (dev)',
            //     accelerator: 'Ctrl+R',
            //     click: () => {
            //         const win = BrowserWindow.getFocusedWindow();
            //         if (win) {
            //             win.reload();
            //         }
            //     }
            // },
        ],
    }
];

// Menú solo para desarrollo con todo
function getMenuDev(): Electron.MenuItemConstructorOptions {
  return {
    label: 'Debug',
    submenu: [
        // **SOLO DEV**
        {
            label: 'Consola de desarrollador',
            accelerator: 'Ctrl+Shift+I',
            click: () => {
                const win = BrowserWindow.getFocusedWindow();
                if (win) {
                    win.webContents.toggleDevTools();
                }
            }
        },
        {
            label: 'Recargar (dev)',
            accelerator: 'Ctrl+R',
            click: () => {
                const win = BrowserWindow.getFocusedWindow();
                if (win) {
                    win.reload();
                }
            }
        },
    ],
  }
}

// Si estamos en macOS, añadimos el menú de la app al principio
const macMenu = getMacAppMenu();
if (macMenu) {
  menuTemplate.unshift(macMenu);
  menuTemplate.push(getMacEditMenu());
}

const menuDev = getMenuDev();
if (isDev()) menuTemplate.push(menuDev);

export const MenuBar = {
  menuTemplate,
  buildMenu() {
    return Menu.buildFromTemplate(menuTemplate);
  }
};

// Menú vacío (solo con "Acerca de..." si es macOS)
export const EmptyMenu = {
  buildMenu() {
    const emptyMenu: Electron.MenuItemConstructorOptions[] = [];

    const macMenu = getMacAppMenu();
    if (macMenu) {
      emptyMenu.unshift(macMenu);
    }

    return Menu.buildFromTemplate(emptyMenu);
  }
};