
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../../client/.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
};

async function migrate() {
    console.log('🚀 Starting migration from Local SQLite to Supabase...');

    // 1. Setup Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in client/.env');
        process.exit(1);
    }

    // REMOVED unauthenticated client creation here to avoid duplicate declaration

    console.log('\n🔐 Authentication');
    console.log('Since you requested browser auth, please follow these steps:');
    console.log('1. Go to your running app (http://localhost:3000)');
    console.log('2. Log in (or Sign Up) with your desired account.');
    console.log('3. Open Developer Tools (F12) -> Console.');
    console.log('4. Run this command: `JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith("sb-")))).access_token`');
    console.log('5. Copy the token (string) and paste it below.');

    const accessToken = await question('\nEnter Access Token: ');

    // Create authenticated client ONCE
    const supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('❌ Authentication failed:', authError?.message);
        process.exit(1);
    }
    const userId = user.id;
    console.log(`✓ Authenticated as ${user.email} (${userId})`);

    // 2. Read Local DB
    const dbPath = path.join(__dirname, '../../data/pregnancy_tracker.db');
    if (!fs.existsSync(dbPath)) {
        console.error('❌ Local database not found at', dbPath);
        process.exit(1);
    }

    const filebuffer = fs.readFileSync(dbPath);
    const SQL = await initSqlJs();
    const db = new SQL.Database(filebuffer);

    console.log('✓ Loaded local database');

    // 3. Migrate Pregnancies
    console.log('\n📦 Migrating Pregnancies...');
    const result = db.exec("SELECT * FROM pregnancies");
    if (result.length > 0) {
        const columns = result[0].columns;
        const rows = result[0].values;

        for (const row of rows) {
            const rowData: any = {};
            columns.forEach((col: string, i: number) => rowData[col] = row[i]);

            console.log(`  Processing pregnancy (LMP: ${rowData.lmp_date})...`);

            const { data: newPregnancy, error } = await supabase
                .from('pregnancies')
                .insert({
                    user_id: userId,
                    lmp_date: rowData.lmp_date,
                    due_date: rowData.due_date,
                    is_active: rowData.is_active === 1
                })
                .select()
                .single();

            if (error) {
                console.error('  ❌ Failed to insert pregnancy:', error.message);
                continue;
            }

            const oldId = rowData.id;
            const newId = newPregnancy.id;

            // 4. Migrate Logs for this pregnancy
            const logsResult = db.exec(`SELECT * FROM daily_logs WHERE pregnancy_id = '${oldId}'`);
            if (logsResult.length > 0) {
                const logCols = logsResult[0].columns;
                const logRows = logsResult[0].values;
                const logsToInsert = logRows.map((lRow: any[]) => {
                    const lData: any = {};
                    logCols.forEach((lc: string, k: number) => lData[lc] = lRow[k]);

                    return {
                        pregnancy_id: newId,
                        user_id: userId,
                        log_date: lData.log_date,
                        symptoms: JSON.parse(lData.symptoms || '[]'),
                        mood: lData.mood,
                        notes: lData.notes,
                        weight: lData.weight,
                        blood_pressure: lData.blood_pressure,
                        blood_sugar: lData.blood_sugar
                    };
                });

                if (logsToInsert.length > 0) {
                    const { error: logsError } = await supabase.from('daily_logs').insert(logsToInsert);
                    if (logsError) console.error('    ❌ Failed to insert logs:', logsError.message);
                    else console.log(`    ✓ Migrated ${logsToInsert.length} logs`);
                }
            }

            // 5. Migrate Appointments
            const aptResult = db.exec(`SELECT * FROM appointments WHERE pregnancy_id = '${oldId}'`);
            if (aptResult.length > 0) {
                const aptCols = aptResult[0].columns;
                const aptRows = aptResult[0].values;
                const aptsToInsert = aptRows.map((aRow: any[]) => {
                    const aData: any = {};
                    aptCols.forEach((ac: string, m: number) => aData[ac] = aRow[m]);

                    return {
                        pregnancy_id: newId,
                        user_id: userId,
                        title: aData.title,
                        datetime: aData.datetime,
                        location: aData.location,
                        notes: aData.notes
                    };
                });

                if (aptsToInsert.length > 0) {
                    const { error: aptError } = await supabase.from('appointments').insert(aptsToInsert);
                    if (aptError) console.error('    ❌ Failed to insert appointments:', aptError.message);
                    else console.log(`    ✓ Migrated ${aptsToInsert.length} appointments`);
                }
            }
        }
    } else {
        console.log('No local pregnancies found.');
    }

    console.log('\n✨ Migration Complete!');
    process.exit(0);
}

migrate().catch(console.error);
