import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import fontkit from '@pdf-lib/fontkit';

let arialPath: string;

switch (os.platform()) {
	case 'darwin':
		arialPath = '/System/Library/Fonts/Supplemental/Arial.ttf';
		break;
	case 'win32':
		arialPath = 'C:/Windows/Fonts/arial.ttf';
		break;
	default:
		arialPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
		break;
}

async function embedFonts() {
	const fontBytes = await fs.readFile(arialPath);
	const fontkitFont = fontkit.create(fontBytes);
	console.log(fontkitFont);
}

embedFonts();
