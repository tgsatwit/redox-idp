import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  AnalyzeDocumentCommand,
  FeatureType,
} from "@aws-sdk/client-textract";
import { createId } from "@paralleldrive/cuid2";

const s3Client = new S3Client({
  region: process.env.APP_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.APP_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.APP_SECRET_ACCESS_KEY || ''
  }
});

const textractClient = new TextractClient({
  region: process.env.APP_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.APP_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.APP_SECRET_ACCESS_KEY || ''
  }
});

// Credit card regex patterns with multiple variations to handle different spacing
const fullCardRegex = [
  // Standard format with or without spaces/dashes
  /(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})/g,
  // No separators at all (16 consecutive digits)
  /(\d{16})/g,
  // Different grouping patterns that might occur
  /(\d{4,6})[\s-]?(\d{4,6})[\s-]?(\d{4,6})/g
];

// Extract the individual groups of 4 digits, even if they're not separated
const extractCardGroups = (cardNumber: string): string[] => {
  // Remove any non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  // Check if we have a valid length for a credit card (typically 16)
  if (digitsOnly.length < 15 || digitsOnly.length > 19) {
    return [];
  }
  
  // For a standard card, split into 4 groups of 4 digits
  if (digitsOnly.length === 16) {
    return [
      digitsOnly.substring(0, 4),
      digitsOnly.substring(4, 8),
      digitsOnly.substring(8, 12),
      digitsOnly.substring(12, 16)
    ];
  }
  
  // For other lengths, try to detect the last 4 digits and divide the rest
  const lastFour = digitsOnly.substring(digitsOnly.length - 4);
  const remaining = digitsOnly.substring(0, digitsOnly.length - 4);
  
  // Divide the remaining digits into 3 roughly equal groups
  const groupSize = Math.ceil(remaining.length / 3);
  const groups = [];
  
  for (let i = 0; i < remaining.length; i += groupSize) {
    groups.push(remaining.substring(i, Math.min(i + groupSize, remaining.length)));
  }
  
  // Add the last 4 digits as the final group
  groups.push(lastFour);
  
  return groups;
};

// For debugging
function logBlockGeometry(block: any) {
  const geometry = block.geometry?.BoundingBox;
  return geometry 
    ? { id: block.id, text: block.text, left: geometry.Left, top: geometry.Top, width: geometry.Width, height: geometry.Height } 
    : { id: block.id, text: block.text, geometry: 'missing' };
}

export async function POST(request: Request) {
  console.log("Credit card detection API called");
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("No file provided");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Check file type
    const validTypes = [
      "application/pdf",
      "image/jpeg", 
      "image/jpg",
      "image/png", 
      "image/tiff"
    ];
    
    if (!validTypes.includes(file.type)) {
      console.log(`Unsupported file type: ${file.type}`);
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Please upload a PDF or image.` },
        { status: 400 }
      );
    }

    // Get file buffer
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    console.log(`File buffer created, length: ${fileBytes.length} bytes`);

    // Generate a unique ID for the file
    const fileId = createId();
    const key = `uploads/${fileId}-${file.name}`;
    console.log(`Uploading to S3: ${key}`);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.APP_S3_BUCKET,
        Key: key,
        Body: fileBytes,
        ContentType: file.type,
      })
    );
    console.log("S3 upload successful");

    // Call Textract with WORD-level analysis to get individual chunks
    console.log("Calling Textract AnalyzeDocument");
    const textractResponse = await textractClient.send(
      new AnalyzeDocumentCommand({
        Document: {
          S3Object: {
            Bucket: process.env.APP_S3_BUCKET,
            Name: key,
          },
        },
        FeatureTypes: [FeatureType.FORMS, FeatureType.TABLES],
      })
    );

    // Extract text and bounding boxes from blocks
    const blocks = textractResponse.Blocks || [];
    console.log(`Received ${blocks.length} blocks from Textract`);
    
    // Store all text blocks with their bounding boxes - prioritize WORD level blocks
    const wordBlocks = blocks
      .filter((block) => block.BlockType === "WORD")
      .map((block) => ({
        id: block.Id || createId(),
        text: block.Text || "",
        type: block.BlockType,
        confidence: block.Confidence,
        geometry: block.Geometry,
        page: block.Page || 1,
      }));

    const lineBlocks = blocks
      .filter((block) => block.BlockType === "LINE")
      .map((block) => ({
        id: block.Id || createId(),
        text: block.Text || "",
        type: block.BlockType,
        confidence: block.Confidence,
        geometry: block.Geometry,
        page: block.Page || 1,
      }));
      
    console.log(`Found ${wordBlocks.length} WORD blocks and ${lineBlocks.length} LINE blocks`);

    // Extract full text for initial credit card detection
    let fullText = lineBlocks.map(block => block.text).join(" ");
    console.log("Full text extracted:", fullText);
    
    // Apply all regex patterns and collect unique matches
    const allMatches = new Set<string>();
    
    // Try each regex pattern
    for (const regex of fullCardRegex) {
      const matches = Array.from(fullText.matchAll(regex));
      matches.forEach(match => {
        // Add the full match
        allMatches.add(match[0]);
        
        // For the 16 consecutive digits pattern, we need to format it
        if (match[0].replace(/\D/g, '').length === 16 && !match[0].includes(' ') && !match[0].includes('-')) {
          const digitsOnly = match[0].replace(/\D/g, '');
          // Format into 4 groups of 4
          const formatted = `${digitsOnly.substring(0, 4)} ${digitsOnly.substring(4, 8)} ${digitsOnly.substring(8, 12)} ${digitsOnly.substring(12, 16)}`;
          allMatches.add(formatted);
        }
      });
    }
    
    console.log(`Found ${allMatches.size} potential credit card matches after applying all patterns`);
    
    // We also need to check if there are any sequences of 16 digits that might not match our regex
    const sixteenDigitSequences = /\d{16}/g;
    const digitsMatches = Array.from(fullText.matchAll(sixteenDigitSequences));
    digitsMatches.forEach(match => {
      allMatches.add(match[0]);
    });
    
    const creditCardFound = allMatches.size > 0;
    const creditCardResults = [];
    
    // Process each potential credit card match
    for (const matchString of Array.from(allMatches)) {
      // Clean up the card number to get just digits
      const fullCardNumber = matchString.replace(/\D/g, '');
      
      // Skip if not a plausible card number length
      if (fullCardNumber.length < 15 || fullCardNumber.length > 19) {
        continue;
      }
      
      // Extract the groups
      const cardGroups = extractCardGroups(matchString);
      const lastFourDigits = fullCardNumber.slice(-4);
      
      // Create the redacted version
      const redactedNumber = "**** **** **** " + lastFourDigits;
      
      console.log(`Processing card: ${cardGroups.join(' ')} -> ${redactedNumber}`);
      
      // Find blocks containing each group or parts of the card number
      // We'll start with a more aggressive approach to find all relevant blocks
      
      const findRelevantBlocks = () => {
        // First try to find blocks that contain the exact card number
        const exactMatches = lineBlocks.filter(block => 
          block.text.includes(matchString) || 
          block.text.replace(/\D/g, '').includes(fullCardNumber)
        );
        
        if (exactMatches.length > 0) {
          console.log(`Found ${exactMatches.length} blocks containing the full card number`);
          return exactMatches;
        }
        
        // Try to find blocks that contain significant chunks of the card number
        const significantMatches = [];
        
        // Check for blocks containing at least 8 consecutive digits from the card
        for (let i = 0; i <= fullCardNumber.length - 8; i++) {
          const chunk = fullCardNumber.substring(i, i + 8);
          const blocksWithChunk = wordBlocks.filter(block => 
            block.text.replace(/\D/g, '').includes(chunk)
          );
          
          significantMatches.push(...blocksWithChunk);
        }
        
        if (significantMatches.length > 0) {
          console.log(`Found ${significantMatches.length} blocks containing significant chunks of the card`);
          return significantMatches;
        }
        
        // As a last resort, try to find blocks containing the digit groups
        const groupMatches = [];
        
        for (const group of cardGroups) {
          if (!group) continue;
          
          const blocksWithGroup = wordBlocks.filter(block => 
            block.text.replace(/\D/g, '').includes(group)
          );
          
          groupMatches.push(...blocksWithGroup);
        }
        
        if (groupMatches.length > 0) {
          console.log(`Found ${groupMatches.length} blocks containing card digit groups`);
          return groupMatches;
        }
        
        // If all else fails, return a synthetic block
        console.log("No blocks found, creating synthetic block");
        return [{
          id: `synthetic-${createId()}`,
          text: matchString,
          type: "SYNTHETIC",
          confidence: 100,
          page: 1,
          geometry: {
            BoundingBox: {
              Width: 0.3,
              Height: 0.03,
              Left: 0.1,
              Top: 0.1
            }
          }
        }];
      };
      
      // Get blocks associated with this card number
      const relevantBlocks = findRelevantBlocks();
      
      // Remove duplicates
      const uniqueBlocks = Array.from(
        new Map(relevantBlocks.map(block => [block.id, block])).values()
      );
      
      // Sort blocks in reading order
      uniqueBlocks.sort((a, b) => {
        const aBox = a.geometry?.BoundingBox;
        const bBox = b.geometry?.BoundingBox;
        
        if (!aBox || !bBox) return 0;
        
        // First by page
        if (a.page !== b.page) return a.page - b.page;
        
        // Then by vertical position, with some tolerance
        const yDiff = aBox.Top - bBox.Top;
        if (Math.abs(yDiff) > 0.01) return yDiff;
        
        // If on roughly the same line, sort by horizontal position
        return aBox.Left - bBox.Left;
      });
      
      // Determine which blocks contain the first 12 digits vs the last 4
      const enhancedBlocks = uniqueBlocks.map(block => {
        // This logic determines if the block should be redacted
        // We'll redact blocks that don't contain only the last 4 digits
        const containsLastFourOnly = 
          block.text.includes(lastFourDigits) && 
          !cardGroups.slice(0, -1).some(group => block.text.includes(group));
        
        return {
          id: block.id,
          text: block.text,
          geometry: block.geometry,
          page: block.page,
          groupInfo: {
            isFirstTwelve: !containsLastFourOnly,
            text: block.text
          }
        };
      });
      
      // Make sure each block has geometry
      enhancedBlocks.forEach(block => {
        if (!block.geometry || !block.geometry.BoundingBox) {
          console.log(`Adding default geometry for block: ${block.id}`);
          block.geometry = {
            BoundingBox: {
              Width: 0.1,
              Height: 0.03,
              Left: 0.1,
              Top: 0.1
            }
          };
        }
      });
      
      creditCardResults.push({
        original: matchString,
        redacted: redactedNumber,
        groups: cardGroups,
        lastFourDigits,
        blocks: enhancedBlocks
      });
    }

    // Return results
    return NextResponse.json({
      success: true,
      creditCardFound,
      creditCardCount: creditCardResults.length,
      results: creditCardResults,
      wordBlocks: wordBlocks.slice(0, 50), // Limit the number of blocks sent back
      lineBlocks: lineBlocks.slice(0, 20),
      method: "aws-textract",
    });
  } catch (error) {
    console.error("Error detecting credit card:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "An unknown error occurred",
        success: false,
        creditCardFound: false
      },
      { status: 500 }
    );
  }
} 