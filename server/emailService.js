const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const POP3Client = require('poplib');
const dotenv = require('dotenv');

dotenv.config();

const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  imap: {
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT) || 993,
    tls: process.env.IMAP_TLS === 'true' || true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS
  },
  pop3: {
    host: process.env.POP3_HOST || 'pop.gmail.com',
    port: parseInt(process.env.POP3_PORT) || 995,
    tls: process.env.POP3_TLS === 'true' || true,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    useMock: process.env.USE_POP3_MOCK === 'true' || false
  }
};

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      ...emailConfig.smtp,
      tls: {
        rejectUnauthorized: false
      }
    });
    
    const info = await transporter.sendMail({
      from: `"Todo App" <${emailConfig.smtp.auth.user}>`,
      to,
      subject,
      text,
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getEmailsIMAP = async (limit = 10) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  if (!emailConfig.imap.user || !emailConfig.imap.password) {
    return [{
      id: 'error-1',
      subject: 'IMAP Error: Missing Credentials',
      from: {'text': 'system@example.com'},
      date: new Date(),
      body: 'Please set EMAIL_USER and EMAIL_PASS environment variables to connect to your IMAP account.',
      html: '<p>Please set EMAIL_USER and EMAIL_PASS environment variables to connect to your IMAP account.</p>'
    }];
  }
  
  return new Promise((resolve) => {
    try {
      const imap = new Imap({
        ...emailConfig.imap,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 10000
      });
      
      const emails = [];
      let connectionError = null;
      let connectionTimeout = null;
      
      connectionTimeout = setTimeout(() => {
        if (imap && imap.state && imap.state !== 'disconnected') {
          imap.end();
        }
        
        resolve([{
          id: 'timeout-1',
          subject: 'IMAP Error: Connection Timeout',
          from: {'text': 'system@example.com'},
          date: new Date(),
          body: 'Connection to IMAP server timed out. Please check your network settings and try again.',
          html: '<p>Connection to IMAP server timed out. Please check your network settings and try again.</p>'
        }]);
      }, 20000);
      
      imap.once('ready', () => {
        clearTimeout(connectionTimeout);
        
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            resolve([{
              id: 'error-2',
              subject: 'IMAP Error: Cannot Open Inbox',
              from: {'text': 'system@example.com'},
              date: new Date(),
              body: `Failed to open INBOX: ${err.message || 'Unknown error'}`,
              html: `<p>Failed to open INBOX: ${err.message || 'Unknown error'}</p>`
            }]);
            return;
          }

          const totalMessages = box.messages.total;
          
          if (totalMessages === 0) {
            imap.end();
            resolve([{
              id: 'empty-1',
              subject: 'No Messages',
              from: {'text': 'system@example.com'},
              date: new Date(),
              body: 'Your IMAP mailbox is empty.',
              html: '<p>Your IMAP mailbox is empty.</p>'
            }]);
            return;
          }

          const actualLimit = Math.min(limit, 20, totalMessages);
          const startIndex = Math.max(totalMessages - actualLimit + 1, 1);
          const endIndex = totalMessages;
          
          try {
            const fetchOptions = {
              bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
              struct: true
            };
            
            const fetch = imap.seq.fetch(`${startIndex}:${endIndex}`, fetchOptions);
            
            fetch.on('message', (msg, seqno) => {
              const email = { 
                id: `msg-${seqno}`,
                seqno: seqno 
              };
              
              msg.on('body', (stream, info) => {
                let buffer = '';
                
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
                
                stream.once('end', () => {
                  if (info.which === 'TEXT') {
                    email.body = buffer;
                  } else {
                    const header = Imap.parseHeader(buffer);
                    email.subject = header.subject ? header.subject[0] : 'No Subject';
                    email.from = {text: header.from ? header.from[0] : 'Unknown Sender'};
                    email.to = header.to ? header.to[0] : '';
                    email.date = header.date ? new Date(header.date[0]) : new Date();
                    
                    email.html = `<p>${email.body || 'No content'}</p>`;
                  }
                });
              });
              
              msg.once('attributes', (attrs) => {
                email.attributes = attrs;
              });
              
              msg.once('end', () => {
                if (email.subject && email.from) {
                  emails.push(email);
                }
              });
            });
            
            fetch.once('error', (err) => {
              console.error('[IMAP] Error fetching messages:', err);
              connectionError = err;
            });
            
            fetch.once('end', () => {
              imap.end();
              
              if (emails.length > 0) {
                resolve(emails.sort((a, b) => b.seqno - a.seqno));
                return;
              }
              
              if (connectionError) {
                resolve([{
                  id: 'error-3',
                  subject: 'IMAP Error: Failed to Fetch Messages',
                  from: {'text': 'system@example.com'},
                  date: new Date(),
                  body: `Failed to fetch messages: ${connectionError.message || 'Unknown error'}`,
                  html: `<p>Failed to fetch messages: ${connectionError.message || 'Unknown error'}</p>`
                }]);
                return;
              }
              
              resolve([{
                id: 'empty-2',
                subject: 'IMAP: No Valid Messages',
                from: {'text': 'system@example.com'},
                date: new Date(),
                body: 'Your mailbox contains messages, but none could be properly parsed.',
                html: '<p>Your mailbox contains messages, but none could be properly parsed.</p>'
              }]);
            });
          } catch (fetchError) {
            console.error('[IMAP] Error setting up fetch:', fetchError);
            imap.end();
            resolve([{
              id: 'error-4',
              subject: 'IMAP Error: Failed to Set Up Fetch',
              from: {'text': 'system@example.com'},
              date: new Date(),
              body: `Error setting up fetch operation: ${fetchError.message || 'Unknown error'}`,
              html: `<p>Error setting up fetch operation: ${fetchError.message || 'Unknown error'}</p>`
            }]);
          }
        });
      });
      
      imap.once('error', (err) => {
        console.error('[IMAP] Connection error:', err);
        
        if (imap.state !== 'disconnected') {
          imap.end();
        }
        
        resolve([{
          id: 'conn-error-1',
          subject: 'IMAP Error: Connection Failed',
          from: {'text': 'system@example.com'},
          date: new Date(),
          body: `Failed to connect to IMAP server: ${err.message || 'Unknown error'}`,
          html: `<p>Failed to connect to IMAP server: ${err.message || 'Unknown error'}</p>
                <p>This may be due to:</p>
                <ul>
                  <li>Network connectivity issues</li>
                  <li>Incorrect email credentials</li>
                  <li>IMAP access is not enabled in your email account</li>
                  <li>Email provider's security settings blocking access</li>
                </ul>
                <p>For Gmail, make sure to:</p>
                <ul>
                  <li>Enable IMAP access in Gmail settings</li>
                  <li>Use an application-specific password if 2FA is enabled</li>
                  <li>Allow access for less secure apps (if applicable)</li>
                </ul>`
        }]);
      });
      
      imap.once('end', () => {
        clearTimeout(connectionTimeout);
      });
      
      imap.connect();
      
    } catch (error) {
      console.error('[IMAP] Critical error:', error);
      
      resolve([{
        id: 'critical-error-1',
        subject: 'IMAP Error: Critical Failure',
        from: {'text': 'system@example.com'},
        date: new Date(),
        body: `A critical error occurred: ${error.message || 'Unknown error'}`,
        html: `<p>A critical error occurred: ${error.message || 'Unknown error'}</p>
              <p>Please check your server configuration and network settings.</p>`
      }]);
    }
  });
};

const getEmailsPOP3 = async (limit = 10) => {
  console.log('[POP3] Starting enhanced POP3 client');
  
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  if (!emailConfig.pop3.user || !emailConfig.pop3.password) {
    console.error('[POP3] Credentials not provided in environment variables');
    return [{
      id: 1,
      subject: 'POP3 Error: Missing Credentials',
      from: 'system@example.com',
      date: new Date(),
      text: 'Please set EMAIL_USER and EMAIL_PASS environment variables to connect to your POP3 account.',
      html: '<p>Please set EMAIL_USER and EMAIL_PASS environment variables to connect to your POP3 account.</p>'
    }];
  }
  
  return new Promise((resolve) => {
    try {
      console.log(`[POP3] Connecting to ${emailConfig.pop3.host}:${emailConfig.pop3.port}`);
      
      const client = new POP3Client(
        emailConfig.pop3.port,
        emailConfig.pop3.host,
        {
          tlserrs: false,     
          enabletls: emailConfig.pop3.tls,
          debug: false,
          ignoretlserrs: true 
        }
      );
      
      let connectionTimeout = setTimeout(() => {
        console.error('[POP3] Connection timed out after 10 seconds');
        try {
          client.quit();
        } catch (e) {
        }
        
        resolve([{
          id: 1,
          subject: 'POP3 Error: Connection Timeout',
          from: 'system@example.com',
          date: new Date(),
          text: 'Connection to POP3 server timed out. Please check your network settings and try again.',
          html: '<p>Connection to POP3 server timed out. Please check your network settings and try again.</p>'
        }]);
      }, 10000);
      
      client.on('error', (err) => {
        console.error('[POP3] Client error:', err);
        clearTimeout(connectionTimeout);
        
        resolve([{
          id: 1,
          subject: 'POP3 Error: Client Error',
          from: 'system@example.com',
          date: new Date(),
          text: `POP3 client error: ${err.message || 'Unknown error'}`,
          html: `<p>POP3 client error: ${err.message || 'Unknown error'}</p>
                <p>This may be due to network issues, server configuration, or incorrect credentials.</p>`
        }]);
      });
      
      client.on('connect', () => {
        console.log('[POP3] Connected to server, attempting login');
        
        client.login(emailConfig.pop3.user, emailConfig.pop3.password);
      });
      
      client.on('invalid-state', (cmd) => {
        console.error(`[POP3] Invalid state, command: ${cmd}`);
        clearTimeout(connectionTimeout);
        
        resolve([{
          id: 1,
          subject: 'POP3 Error: Authentication Failed',
          from: 'system@example.com',
          date: new Date(),
          text: 'Failed to authenticate with the POP3 server. Please check your credentials.',
          html: `<p>Failed to authenticate with the POP3 server. Please check your credentials.</p>
                <p>For Gmail, make sure to:</p>
                <ul>
                  <li>Enable POP3 access in Gmail settings</li>
                  <li>Use an app-specific password if 2FA is enabled</li>
                  <li>Allow access for less secure apps (if applicable)</li>
                </ul>`
        }]);
        
        try {
          client.quit();
        } catch (e) {
        }
      });
      
      client.on('login', (status, rawData) => {
        console.log(`[POP3] Login ${status ? 'successful' : 'failed'}`);
        clearTimeout(connectionTimeout);
        
        if (!status) {
          console.error('[POP3] Login failed:', rawData);
          
          resolve([{
            id: 1,
            subject: 'POP3 Error: Login Failed',
            from: 'system@example.com',
            date: new Date(),
            text: `Login to POP3 server failed: ${rawData}`,
            html: `<p>Login to POP3 server failed: ${rawData}</p>
                  <p>Check your email and password, and make sure POP3 access is enabled.</p>`
          }]);
          
          try {
            client.quit();
          } catch (e) {
          }
          return;
        }
        
        client.stat();
      });
      
      client.on('stat', (status, msgCount, msgSize) => {
        console.log(`[POP3] Mailbox stats: ${msgCount} messages, ${msgSize} bytes`);
        
        if (msgCount === 0) {
          console.log('[POP3] No messages in mailbox');
          resolve([{
            id: 1,
            subject: 'No Messages',
            from: 'system@example.com',
            date: new Date(),
            text: 'Your mailbox is empty.',
            html: '<p>Your mailbox is empty.</p>'
          }]);
          
          try {
            client.quit();
          } catch (e) {
          }
          return;
        }
        
        client.list();
      });
      
      client.on('list', (status, msgCount, msgList) => {
        if (!status) {
          console.error('[POP3] Failed to get message list');
          resolve([{
            id: 1,
            subject: 'POP3 Error: Failed to List Messages',
            from: 'system@example.com',
            date: new Date(),
            text: 'Failed to retrieve message list from the POP3 server.',
            html: '<p>Failed to retrieve message list from the POP3 server.</p>'
          }]);
          
          try {
            client.quit();
          } catch (e) {
          }
          return;
        }
        
        console.log(`[POP3] Message list retrieved, ${msgCount} messages`);
        
        const actualLimit = Math.min(limit, 20, msgCount);
        const msgsToRetrieve = Array.from({length: msgCount}, (_, i) => i + 1)
          .sort((a, b) => b - a) 
          .slice(0, actualLimit);
        
        console.log(`[POP3] Will retrieve ${actualLimit} messages: ${msgsToRetrieve.join(', ')}`);
        
        const messages = [];
        let retrievedCount = 0;
        
        const retrieveNext = () => {
          if (msgsToRetrieve.length === 0) {
            console.log(`[POP3] Retrieved ${messages.length} messages successfully`);
            
            try {
              client.quit();
            } catch (e) {
            }
            
            if (messages.length === 0) {
              resolve([{
                id: 1,
                subject: 'POP3 Error: No Messages Retrieved',
                from: 'system@example.com',
                date: new Date(),
                text: `Your mailbox contains ${msgCount} messages, but none could be retrieved.`,
                html: '<p>Your mailbox contains messages, but none could be retrieved.</p><p>This might be due to format incompatibilities or access restrictions.</p>'
              }]);
            } else {
              resolve(messages);
            }
            return;
          }
          
          const msgNum = msgsToRetrieve.shift();
          console.log(`[POP3] Retrieving message ${msgNum}`);
          
          client.retr(msgNum);
        };
        
        client.on('retr', (status, msgNum, data) => {
          retrievedCount++;
          
          if (status) {
            try {
              console.log(`[POP3] Message ${msgNum} retrieved, parsing...`);
              simpleParser(data).then(parsed => {
                console.log(`[POP3] Message ${msgNum} parsed successfully`);
                
                messages.push({
                  id: msgNum,
                  subject: parsed.subject || 'No Subject',
                  from: parsed.from ? parsed.from.text : 'Unknown Sender',
                  date: parsed.date || new Date(),
                  text: parsed.text || '',
                  html: parsed.html || `<p>${parsed.text || 'No content'}</p>`
                });
                
                retrieveNext();
              }).catch(parseError => {
                console.error(`[POP3] Error parsing message ${msgNum}:`, parseError);
                
                messages.push({
                  id: msgNum,
                  subject: 'Parsing Error',
                  from: 'system@example.com',
                  date: new Date(),
                  text: 'Message could not be parsed',
                  html: '<p>This message could not be properly parsed due to format incompatibilities.</p>'
                });
                
                retrieveNext();
              });
            } catch (error) {
              console.error(`[POP3] Error processing message ${msgNum}:`, error);
              retrieveNext();
            }
          } else {
            console.error(`[POP3] Failed to retrieve message ${msgNum}`);
            retrieveNext();
          }
        });
        
        retrieveNext();
      });
      
    } catch (error) {
      console.error('[POP3] Critical error:', error);
      
      resolve([{
        id: 1,
        subject: 'POP3 Error: Critical Failure',
        from: 'system@example.com',
        date: new Date(),
        text: `A critical error occurred: ${error.message || 'Unknown error'}`,
        html: `<p>A critical error occurred: ${error.message || 'Unknown error'}</p>
              <p>Please check your server configuration and network settings.</p>`
      }]);
    }
  });
};

const getMockEmails = () => {
  console.log('Using POP3 mock implementation instead of real client');
  return new Promise((resolve) => {
    const mockEmails = [
      {
        id: 1,
        subject: 'Welcome to Todo App',
        from: 'Todo System <system@todoapp.example>',
        date: new Date(),
        text: 'Welcome to Todo App! This is a mock email since POP3 connection is currently unavailable.\n\nThe POP3 protocol may be blocked by email providers or requires special security settings.',
        html: '<h2>Welcome to Todo App!</h2><p>This is a mock email since POP3 connection is currently unavailable.</p><p>The POP3 protocol may be blocked by email providers or requires special security settings.</p>'
      },
      {
        id: 2,
        subject: 'Your Tasks for Today',
        from: 'Todo System <system@todoapp.example>',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), 
        text: 'You have several tasks to complete today. Check your todo list!',
        html: '<h2>Your Tasks for Today</h2><p>You have several tasks to complete today. Check your todo list!</p>'
      },
      {
        id: 3,
        subject: 'POP3 Troubleshooting',
        from: 'Support <support@todoapp.example>',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 
        text: 'To enable actual POP3 connections, make sure you:\n1. Enable POP3 access in your Gmail settings\n2. Use an App Password if you have 2-factor authentication\n3. Allow less secure apps in your Google account\n4. Check that your network/firewall allows POP3 traffic',
        html: '<h2>POP3 Troubleshooting</h2><p>To enable actual POP3 connections, make sure you:</p><ol><li>Enable POP3 access in your Gmail settings</li><li>Use an App Password if you have 2-factor authentication</li><li>Allow less secure apps in your Google account</li><li>Check that your network/firewall allows POP3 traffic</li></ol>'
      }
    ];
    
    setTimeout(() => {
      resolve(mockEmails);
    }, 500);
  });
};

const sendTaskViaEmail = async (to, task) => {
  const subject = `Task: ${task.title}`;
  
  const text = `
    Task: ${task.title}
    Description: ${task.description || 'No description'}
    Status: ${task.completed ? 'Completed' : 'Not completed'}
    Created: ${new Date(task.createdAt).toLocaleString()}
  `;
  
  const html = `
    <h2>Task: ${task.title}</h2>
    <p><strong>Description:</strong> ${task.description || 'No description'}</p>
    <p><strong>Status:</strong> ${task.completed ? 'Completed ✅' : 'Not completed ❌'}</p>
    <p><strong>Created:</strong> ${new Date(task.createdAt).toLocaleString()}</p>
  `;
  
  return await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  getEmailsIMAP,
  getEmailsPOP3,
  getMockEmails,
  sendTaskViaEmail
}; 