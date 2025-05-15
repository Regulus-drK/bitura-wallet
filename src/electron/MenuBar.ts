import { BrowserWindow, Menu } from 'electron';
import { ventanaConfirmarDeleteConfigFiles } from './util.js';

// Definimos el template para el menú
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
                accelerator: 'Ctrl+Shift+I', // Atajo de teclado
                click: () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        win.webContents.toggleDevTools(); // Abre/cierra DevTools
                    }
                }
            }
        ],
    },
    {
        label: 'Test',
        submenu: [
            {
                label: 'Random',
                click: () => null
            }
        ]
    }
];

// Exportamos la plantilla de menú y la función para construirlo
export const MenuBar = {
    menuTemplate,
    buildMenu() {
        return Menu.buildFromTemplate(menuTemplate); // Construye el menú a partir de la plantilla
    }
};

export const EmptyMenu = {
    buildMenu() {    
        const emptyMenu: Electron.MenuItemConstructorOptions[] = [];
        return Menu.buildFromTemplate(emptyMenu);
    }
};


