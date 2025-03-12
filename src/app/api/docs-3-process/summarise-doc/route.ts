import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { 
      text, 
      documentType, 
      documentSubType, 
      extractedFields = [] 
    } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Missing required document text' },
        { status: 400 }
      );
    }

    // Prepare the prompt for the LLM
    const prompt = `
    You are an expert at summarizing documents. Please create a concise and accurate summary of the following document.
    
    Document Type: ${documentType || 'Unknown'}
    Document Sub-Type: ${documentSubType || 'Unknown'}
    
    The document contains the following key information:
    ${extractedFields.length > 0 
      ? extractedFields.map(field => `- ${field.label || field.name}: ${field.value || 'N/A'}`).join('\n')
      : 'No specific fields extracted'
    }
    
    Document Text:
    ${text.substring(0, 4000)} ${text.length > 4000 ? '... [truncated]' : ''}
    
    Please provide a summary of this document that:
    1. Identifies the key purpose and information
    2. Mentions the most important details and dates
    3. Includes any action items or requirements
    4. Is structured in a clear, professional format
    5. Is no more than 200-300 words
    `;
    
    // Call OpenAI API to generate the summary
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant specialized in document summarization that provides accurate, concise summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more focused, deterministic outputs
      max_tokens: 500
    });
    
    // Extract the generated summary
    const summary = response.choices[0]?.message?.content?.trim() || '';
    
    return NextResponse.json({
      success: true,
      summary,
      wordCount: summary.split(/\s+/).length,
      documentType,
      documentSubType
    });
  } catch (error) {
    console.error('Error generating document summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate document summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
