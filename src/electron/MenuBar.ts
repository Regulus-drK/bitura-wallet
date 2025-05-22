import { BrowserWindow, Menu, app } from 'electron';
import { ventanaConfirmarDeleteConfigFiles } from './util.js';

//  Lógica común para personalizar el panel "Acerca de" en macOS
if (process.platform === 'darwin') {
  app.setAboutPanelOptions({
    applicationName: 'Bitura Wallet',
    applicationVersion: '0.1.0',
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
function getEditMenu(): Electron.MenuItemConstructorOptions {
  if (process.platform === 'darwin') {
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
  } else {
    return {
      label: 'Test',
      submenu: [
        {
          label: 'Random',
          click: () => null
        }
      ]
    };
  }
}

// Menú principal con todo
const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
        label: 'Archivo',
        submenu: [
            {
                id: 'test',
                label: 'Restaurar frase semilla',
                click: () => {
                    ventanaConfirmarDeleteConfigFiles();
                }
            },
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
    },
    getEditMenu()
];

// Si estamos en macOS, añadimos el menú de la app al principio
const macMenu = getMacAppMenu();
if (macMenu) {
  menuTemplate.unshift(macMenu);
}

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