import { Menu } from 'electron';

// Definimos el template para el menú
const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
        label: 'Prueba',
        submenu: [
            {
                id: 'test',
                label: 'Prueba',
                click: () => {
                    console.log('Test');
                }
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
