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

    let txt = "\x1B\x40";

    txt += "\x1B\x61\x01";
    txt += "STRUK HITUNG UANG\n";
    txt += new Date().toLocaleString('id-ID') + "\n";
    txt += "--------------------------------\n";

    txt += "\x1B\x61\x00";

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

            txt += left + " ".repeat(Math.max(1,space)) + right + "\n";
        }
    });

    txt += "--------------------------------\n";

    txt += `KERTAS : ${paperTotal.toLocaleString('id-ID')}\n`;
    txt += `KOIN   : ${coinTotal.toLocaleString('id-ID')}\n`;
    txt += `ITEM   : ${qtyTotal}\n`;

    txt += "--------------------------------\n";

    txt += "\x1B\x45\x01";

    txt += `TOTAL  : ${grandTotal.toLocaleString('id-ID')}\n`;

    txt += "\x1B\x45\x00";

    txt += "\n\n\n";

    try{

        const device = await navigator.bluetooth.requestDevice({
            filters:[{
                services:['000018f0-0000-1000-8000-00805f9b34fb']
            }],
            optionalServices:[
                '000018f0-0000-1000-8000-00805f9b34fb'
            ]
        });

        const server = await device.gatt.connect();

        const service = await server.getPrimaryService(
            '000018f0-0000-1000-8000-00805f9b34fb'
        );

        const char = await service.getCharacteristic(
            '00002af1-0000-1000-8000-00805f9b34fb'
        );

        await char.writeValue(
            new TextEncoder().encode(txt)
        );

        alert("Berhasil mencetak!");

    }catch(e){

        alert("Koneksi printer dibatalkan.");
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