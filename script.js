// =========================
// DATA NOMINAL
// =========================
const denoms = [
    { value:100000, label:"100.000", type:"paper" },
    { value:50000, label:"50.000", type:"paper" },
    { value:20000, label:"20.000", type:"paper" },
    { value:10000, label:"10.000", type:"paper" },
    { value:5000, label:"5.000", type:"paper" },
    { value:2000, label:"2.000", type:"paper" },

    { value:1000, label:"1.000 (Kertas)", type:"paper" },

    { value:1000, label:"1.000 (Koin)", type:"coin" },
    { value:500, label:"500", type:"coin" },
    { value:200, label:"200", type:"coin" },
    { value:100, label:"100", type:"coin" }
];

const listDiv = document.getElementById('main-list');

// =========================
// GENERATE UI
// =========================
denoms.forEach((item,i)=>{

    const div = document.createElement('div');

    div.className = 'row';

    div.innerHTML = `
        <div class="nom">${item.label}</div>

        <div class="ctrl">
            <button class="btn minus" onclick="step(${i},-1)">-</button>

            <input type="number" id="q-${i}" value="0" min="0" oninput="calc()">

            <button class="btn plus" onclick="step(${i},1)">+</button>
        </div>

        <div class="res" id="t-${i}">Rp 0</div>
    `;

    listDiv.appendChild(div);
});

// =========================
// STEP
// =========================
function step(i,s){

    const input = document.getElementById(`q-${i}`);

    input.value = Math.max(
        0,
        (parseInt(input.value) || 0) + s
    );

    calc();
}

// =========================
// FORMAT RUPIAH
// =========================
function rupiah(n){
    return "Rp " + n.toLocaleString('id-ID');
}

// =========================
// CALCULATE
// =========================
function calc(){

    let grandTotal = 0;
    let paperTotal = 0;
    let coinTotal = 0;
    let qtyTotal = 0;

    denoms.forEach((item,i)=>{

        const qty = parseInt(document.getElementById(`q-${i}`).value) || 0;

        const sub = qty * item.value;

        qtyTotal += qty;
        grandTotal += sub;

        if(item.type === "paper"){
            paperTotal += sub;
        }else{
            coinTotal += sub;
        }

        document.getElementById(`t-${i}`).innerText = rupiah(sub);
    });

    document.getElementById('paper-total').innerText = rupiah(paperTotal);
    document.getElementById('coin-total').innerText = rupiah(coinTotal);
    document.getElementById('qty-total').innerText = qtyTotal;

    document.getElementById('grand-total').innerText = rupiah(grandTotal);
}

// =========================
// SAVE TXT
// =========================
function saveTxt(){

    const now = new Date();

    const dateStr = now.toLocaleDateString('id-ID').replace(/\//g,'-');

    let grandTotal = 0;
    let paperTotal = 0;
    let coinTotal = 0;
    let qtyTotal = 0;

    let out = "";
    out += "LAPORAN HITUNG UANG\n";
    out += now.toLocaleString('id-ID') + "\n";
    out += "--------------------------------\n";

    denoms.forEach((item,i)=>{

        const qty = parseInt(document.getElementById(`q-${i}`).value) || 0;

        if(qty > 0){

            const sub = qty * item.value;

            qtyTotal += qty;
            grandTotal += sub;

            if(item.type === "paper"){
                paperTotal += sub;
            }else{
                coinTotal += sub;
            }

            let left = `${item.label} x ${qty}`;
            let right = sub.toLocaleString('id-ID');

            let space = 32 - left.length - right.length;

            out += left + " ".repeat(Math.max(1,space)) + right + "\n";
        }
    });

    out += "--------------------------------\n";

    out += `TOTAL KERTAS : ${paperTotal.toLocaleString('id-ID')}\n`;
    out += `TOTAL KOIN   : ${coinTotal.toLocaleString('id-ID')}\n`;
    out += `TOTAL ITEM   : ${qtyTotal}\n`;

    out += "--------------------------------\n";

    out += `TOTAL AKHIR  : ${grandTotal.toLocaleString('id-ID')}\n`;

    const blob = new Blob([out],{type:'text/plain'});

    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);

    a.download = `HitungUang_${dateStr}.txt`;

    a.click();
}

// =========================
// PRINT BLUETOOTH
// =========================
async function printBT(){

    let grandTotal = 0;
    let paperTotal = 0;
    let coinTotal = 0;
    let qtyTotal = 0;

    let txt = "";

    txt += "STRUK HITUNG UANG\n";
    txt += new Date().toLocaleString('id-ID') + "\n";
    txt += "------------------------------\n";

    denoms.forEach((item,i)=>{

        const qty = parseInt(document.getElementById(`q-${i}`).value) || 0;

        if(qty > 0){

            const sub = qty * item.value;

            qtyTotal += qty;
            grandTotal += sub;

            if(item.type === "paper"){
                paperTotal += sub;
            }else{
                coinTotal += sub;
            }

            txt += `${item.label} x ${qty} = ${sub.toLocaleString('id-ID')}\n`;
        }
    });

    txt += "------------------------------\n";
    txt += `TOTAL KERTAS : ${paperTotal.toLocaleString('id-ID')}\n`;
    txt += `TOTAL KOIN   : ${coinTotal.toLocaleString('id-ID')}\n`;
    txt += `TOTAL ITEM   : ${qtyTotal}\n`;
    txt += "------------------------------\n";
    txt += `TOTAL AKHIR  : ${grandTotal.toLocaleString('id-ID')}\n\n\n`;

    try {

        // =========================
        // REQUEST DEVICE
        // =========================
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '000018f0-0000-1000-8000-00805f9b34fb'
            ]
        });

        console.log("DEVICE:", device.name);

        // =========================
        // CONNECT GATT
        // =========================
        const server = await device.gatt.connect();

        // =========================
        // GET SERVICES
        // =========================
        const services = await server.getPrimaryServices();

        let characteristic = null;

        // Cari characteristic writable otomatis
        for(const service of services){

            const chars = await service.getCharacteristics();

            for(const char of chars){

                if(char.properties.write || char.properties.writeWithoutResponse){

                    characteristic = char;
                    break;
                }
            }

            if(characteristic) break;
        }

        if(!characteristic){
            alert("Printer tidak support write characteristic");
            return;
        }

        // =========================
        // PRINT
        // =========================
        const encoder = new TextEncoder();

        await characteristic.writeValue(
            encoder.encode(txt)
        );

        alert("✅ Berhasil print!");

    } catch(err){

        console.error(err);

        alert("❌ Gagal koneksi printer");
    }
}

// =========================
// RESET
// =========================
function resetData(){

    if(confirm("Hapus semua hitungan?")){

        document.querySelectorAll('input').forEach(i=>i.value=0);

        calc();
    }
}

// =========================
calc();