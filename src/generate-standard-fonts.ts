import fs from 'node:fs/promises';
import { PDFDocument, rgb, StandardFonts } from '@cantoo/pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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
		const f = await pdfDoc.embedFont(font);

		page.drawText(label, {
			x: 50,
			y,
			size: 14,
			font: f,
			color: rgb(0, 0, 0),
		});

		y -= 25;
	};

	await draw('Helvetica', StandardFonts.Helvetica);

	const bytes = await pdfDoc.save({ useObjectStreams: false });
	await fs.writeFile('./assets/pdfs/standard-fonts.pdf', bytes);
}

main().catch(console.error);
