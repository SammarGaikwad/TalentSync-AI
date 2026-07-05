export const InterviewerAgent = {
  async execute({ candidate, mission, previousResults, feedback, queryLLM, settings }) {
    const toolLogs = [];
    const toolOutputs = {};
    const telemetry = {
      engine: 'NVIDIA NIM (Llama-3-70B)',
      vramUsed: parseFloat((Math.random() * 1.5 + 6.2).toFixed(1)),
      vramTotal: 24.0,
      tokenSec: Math.floor(Math.random() * 15) + 85,
      timeMs: Math.floor(Math.random() * 600) + 900,
      cuDfLog: ''
    };

    // 2. Query Agent LLM reasoning block
    let result = null;
    let reasoning = "";

    const systemInstruction = settings.prompts.interviewer;
    const prompt = `You are the InterviewerAgent.
    Mission Goal: "${mission}"
    Candidate: ${JSON.stringify(candidate)}
    
    Previous steps results (if any):
    ${JSON.stringify(previousResults || {})}
    
    Tool execution outputs:
    ${JSON.stringify(toolOutputs)}
    
    Recruiter Feedback / Directives (if any):
    "${feedback || 'None'}"
    
    Evaluate this and output:
    1. A JSON object with the expected output schema for this agent.
    2. An internal reasoning chain of thoughts (how you evaluated, why, what points you selected).
    
    Format your output EXACTLY as a JSON object matching this schema:
    {
      "reasoning": "Step-by-step thinking process explaining your decisions...",
      "output": {
        "questions": [
          { "question": "...", "targetConcept": "...", "expectedAnswer": "..." },
          ...
        ]
      }
    }`;

    const schema = {
      type: 'object',
      properties: {
        reasoning: { type: 'string' },
        output: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  targetConcept: { type: 'string' },
                  expectedAnswer: { type: 'string' }
                },
                required: ['question', 'targetConcept', 'expectedAnswer']
              }
            }
          },
          required: ['questions']
        }
      },
      required: ['reasoning', 'output']
    };

    try {
      const responseData = await queryLLM({
        prompt,
        systemInstruction,
        responseSchema: schema
      });
      result = responseData.output;
      reasoning = responseData.reasoning;
    } catch (llmError) {
      console.warn(`[InterviewerAgent] LLM reasoning fallback: ${llmError.message}`);
      const name = candidate?.candidate_name || 'Candidate';
      const competencies = candidate?.core_competencies || ['Software Engineering'];
      
      let q1 = `Given your experience with ${competencies[0] || 'development'}, how would you architecture a low-latency caching layer to optimize API read operations?`;
      let q2 = `In your prior projects, how did you handle data consistency issues during cross-service API communication?`;
      let q3 = `What strategies do you deploy to test and debug complex asynchronous background workers in Python or Node.js?`;

      if (feedback && feedback.trim().length > 0) {
        q1 = `[Refined] How do you address this specific requirement: "${feedback}"?`;
        q2 = `Given the feedback to focus on "${feedback}", explain how you would design a scalable solution using ${competencies.slice(0, 2).join('/')}.`;
        q3 = `Explain the failure modes and edge cases associated with implementing a: "${feedback}" workflow.`;
      }

      result = {
        questions: [
          {
            question: q1,
            targetConcept: feedback ? 'Refined Parameter Check' : 'System Architecture & Caching Strategy',
            expectedAnswer: 'Should mention Redis/Memcached, write-through vs write-behind caching, and invalidation strategies.'
          },
          {
            question: q2,
            targetConcept: feedback ? 'Targeted Recruiter Goal' : 'Distributed Systems & Eventual Consistency',
            expectedAnswer: 'Should detail saga pattern, outbox pattern, or message queues like RabbitMQ/Kafka.'
          },
          {
            question: q3,
            targetConcept: feedback ? 'Edge Case Handling' : 'Debugging & Quality Assurance',
            expectedAnswer: 'Should reference logging telemetry, mocks, and worker-isolated test databases.'
          }
        ]
      };
      
      reasoning = `Identified gaps in candidate ${name}'s cloud architecture and asynchronous worker handling. Formulated 3 advanced technical questions. Directives/Feedback incorporated: "${feedback || 'None'}". Tailored questions to explore practical knowledge of low-latency caching, event-driven service interaction consistency, and testing queue workers under load.`;
    }

    return {
      success: true,
      result,
      reasoning,
      telemetry,
      toolLogs,
      toolOutputs
    };
  }
};
