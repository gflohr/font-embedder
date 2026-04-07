import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import {
	isStandardFont,
	PDFDict,
	PDFDocument,
	PDFName,
	PDFNumber,
} from '@cantoo/pdf-lib';
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
	const pdfBytes = await fs.readFile('./assets/pdfs/standard-fonts.pdf');
	const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBytes));
	pdfDoc.registerFontkit(fontkit);

	const fontBytes = await fs.readFile(arialPath);
	for (const page of pdfDoc.getPages()) {
		const { Font } = page.node.normalizedEntries();
		for (const [fontName, fontRef] of Font.entries()) {
			const fontDict = pdfDoc.context.lookupMaybe(fontRef, PDFDict);
			if (!fontDict) continue;

			console.log(`font name: ${fontName.decodeText()}`);
			console.log(`font dict:\n`, fontDict.toString());

			const descriptor = fontDict.lookupMaybe(
				PDFName.of('FontDescriptor'),
				PDFDict,
			);
			if (descriptor) {
				const isEmbedded =
					descriptor.has(PDFName.of('FontFile')) ||
					descriptor.has(PDFName.of('FontFile2')) ||
					descriptor.has(PDFName.of('FontFile3'));

				if (!isEmbedded) continue;

				// todo: this.embedNonStandardFont(fontName).
				throw new Error(
					`cannot embed non-standard font '${fontName.decodeText()}'`,
				);
			} else {
				// Standard font.
				const baseFont = fontDict.lookup(PDFName.of('BaseFont'), PDFName);
				const baseFontName = baseFont?.decodeText() ?? fontName.decodeText();

				if (!isStandardFont(baseFontName)) {
					// todo: this.embedNonStandardFont(fontName).
					throw new Error(`cannot embed non-standard font '${baseFontName}'`);
				}

				const newFontDict = createFontDictionary(pdfDoc, fontBytes);
				const fontRef = pdfDoc.context.register(newFontDict);
				Font.set(fontName, fontRef);
			}
		}
	}

	const outputBytes = await pdfDoc.save({ useObjectStreams: false });
	await fs.writeFile('./embedded.pdf', outputBytes);
	// That creates a corrupted PDF (error 135).
	console.log(`wrote PDF to ./embedded.pdf`);
}

function scale(value: number, unitsPerEm: number): number {
	return Math.round((value * 1000) / unitsPerEm);
}

function extractMetrics(font: fontkit.Font) {
	const unitsPerEm = font.unitsPerEm;

	const bbox = [
		scale(font.bbox.minX, unitsPerEm),
		scale(font.bbox.minY, unitsPerEm),
		scale(font.bbox.maxX, unitsPerEm),
		scale(font.bbox.maxY, unitsPerEm),
	];

	const ascent = scale(font.ascent, unitsPerEm);
	const descent = scale(font.descent, unitsPerEm);

	const capHeight = font.capHeight ? scale(font.capHeight, unitsPerEm) : ascent;

	const italicAngle = font.italicAngle || 0;

	const widths: number[] = [];

	for (let code = 32; code <= 255; code++) {
		const glyph = font.glyphForCodePoint(code);
		widths.push(scale(glyph.advanceWidth, unitsPerEm));
	}

	return {
		bbox,
		ascent,
		descent,
		capHeight,
		italicAngle,
		widths,
	};
}

function createFontDictionary(
	pdfDoc: PDFDocument,
	fontBytes: Uint8Array,
): PDFDict {
	const ctx = pdfDoc.context;

	const font = fontkit.create(fontBytes);
	console.log(font.familyName);
	console.log(font.fullName);
	console.log(font.postscriptName);
	const metrics = extractMetrics(font);

	// --- Embed font file stream ---
	const fontStream = ctx.flateStream(fontBytes);

	// --- FontDescriptor ---
	const descriptor = ctx.obj({
		Type: PDFName.of('FontDescriptor'),
		FontName: PDFName.of(font.postscriptName || 'CustomFont'),
		Flags: PDFNumber.of(32),
		FontBBox: ctx.obj(metrics.bbox),
		Ascent: PDFNumber.of(metrics.ascent),
		Descent: PDFNumber.of(metrics.descent),
		CapHeight: PDFNumber.of(metrics.capHeight),
		ItalicAngle: PDFNumber.of(metrics.italicAngle),
		StemV: PDFNumber.of(80),
		FontFile2: fontStream,
	});

	// --- Widths array ---
	const widthsArray = ctx.obj(metrics.widths);

	// --- Font dictionary ---
	const fontDict = ctx.obj({
		Type: PDFName.of('Font'),
		Subtype: PDFName.of('TrueType'),
		BaseFont: PDFName.of(font.postscriptName || 'CustomFont'),
		Encoding: PDFName.of('WinAnsiEncoding'),
		FirstChar: PDFNumber.of(32),
		LastChar: PDFNumber.of(255),
		Widths: widthsArray,
		FontDescriptor: descriptor,
	});

	return fontDict;
}

embedFonts();
