import fs from 'node:fs/promises';
import { PDFDocument, rgb, StandardFonts } from '@cantoo/pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as os from 'os';

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

async function main(): Promise<void> {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);

	const page = pdfDoc.addPage();
	const { height } = page.getSize();

	let y = height - 50;

	const draw = async (
		label: string,
		font: StandardFonts | ArrayBuffer | Uint8Array<ArrayBufferLike>,
	): Promise<void> => {
		const f = await pdfDoc.embedFont(font, { subset: true });

		page.drawText(label, {
			x: 50,
			y,
			size: 14,
			font: f,
			color: rgb(0, 0, 0),
		});

		y -= 25;
	};

	const fontBytes = await fs.readFile(arialPath)
	await draw('Arial', new Uint8Array(fontBytes));

	const bytes = await pdfDoc.save({ useObjectStreams: false });
	await fs.writeFile('./assets/pdfs/arial.pdf', bytes);
}

main().catch(console.error);
