//This file implements an ATMEGA 328 microcontroller.

// This code helped a lot: https://github.com/ghewgill/emulino/blob/master/cpu.c


var PC = 0; //Program Counter
var cycles = 0; //ATMEGA 328 cycles elapsed

//var registers = new Array();
var registers = Uint8Array(new ArrayBuffer(32));

//var io_memory = new Array();
var io_memory = Uint8Array(new ArrayBuffer(64));

//var ext_io_memory = new Array();
var ext_io_memory = Uint8Array(new ArrayBuffer(160));

//var sram = new Array();
var sram = Uint8Array(new ArrayBuffer(2048));

//var eeprom = new Array();
var eeprom = Uint8Array(new ArrayBuffer(1024));

var eeprom_ticks = 0;
var timer_0_value = 0;
var timer_0_direction = true;
var timer_1_value = 0;
var timer_1_direction = true;
var debug_called = false; //For debugging stack pointer
//for (i=0; i<32; i++)
//{
//	registers[i]= 0;
//}


//var rom = new Array();
var rom = Uint16Array(new ArrayBuffer(32768));
//var rom = [];

// raw_rom is not byte-swapped and is used for LPM loads.
var raw_rom = Uint16Array(new ArrayBuffer(32768));

//var decoded_rom = new Array();
var decoded_rom = [];

var instruction_table = new Array();
var instruction_name_table = new Array();


rom[0] = 0;
decoded_rom[0] = 50;
instruction_name_table[0] = "NOP";


rom[1] = 63472;
decoded_rom[1] = 8;
instruction_name_table[1] = "BRBC";


// Test program - infinate loop
//rom[0] = 7685;
//rom[1] = 3072;
//rom[2] = 38655;
//rom[3] = 38655;
//rom[4] = 38655;
//rom[5] = 38655;
//rom[6] = 38655;
//rom[7] = 38655;
//rom[8] = 38655;
//rom[9] = 9199;
//rom[10] = 32767;
//rom[11] = 38538;
//rom[12] = 38293;
//rom[13] = 38293;
//rom[14] = 38293;
//rom[15] = 38293;
//rom[16] = 38024;
//rom[17] = 63543;
//rom[18] = 38432
//rom[19] = 62336;

// Counting function
//rom[0] = 38401;
//rom[1] = 38417;
//rom[2] = 4025;
//rom[2] = 38298;
//rom[3] = 63479;

//rom[0] = 37917;
//rom[1] = 55055;

//rom[0] = 41995;

//rom[0] = 61199;
//rom[1] = 11776;

//rom[0] = 61199;
//rom[1] = 12048;
//rom[2] = 513;
//rom[3] = 40720;
//rom[4] = 0;
//rom[5] = 769;
//rom[6] = 38154;
//rom[7] = 28431;
//rom[8] = 48397;

// stack test
//rom[0] = 57345;
//rom[1] = 57362;
//rom[2] = 57379;
//rom[3] = 37647;
//rom[4] = 37663;
//rom[5] = 37679;
//rom[6] = 37343;
//rom[7] = 37359;
//rom[8] = 37375;
//rom[9] = 0;

// bit rotation test
//rom[0] = 59914;
//rom[1] = 38151;
//rom[2] = 53247;


//rom[0] = 38008;
//rom[1] = 38401;
//rom[2] = 64400;
//rom[3] = 38206;
//rom[4] = 61605;

//rom[0] = 38607;
//rom[1] = 38024;
//rom[2] = 16143;

//rom[0] = 38607;
//rom[1] = 38623;
//rom[2] = 5049;
//rom[3] = 38024;


// SREG = io_memory[63]

// stack pointer

// SPH = io_memory[62]
// SPL = io_memory[61]


var current_instruction;

function pad_8bit(n)
{
	while (n.length < 8)
	{
		n = "0" + n;
	}
	
	return n;
}

function update_regs()
{
	for (var i=0; i<32; i++)
	{
		//document.getElementById("reg" + i).value = registers[i].toString(2);
		//document.getElementById("reg" + i).value = pad_8bit(registers[i].toString(2));
		reg_label_objects[i].value = pad_8bit(registers[i].toString(2));
	}
	
	timer_1_label_object.value = ext_io_memory[37] << 8 | ext_io_memory[36];
	sreg_label_object.value = pad_8bit(io_memory[63].toString(2));
	sp_label_object.value = io_memory[62] << 8 | io_memory[61];
}

function initialize()
{
	
	current_instr_object = document.getElementById("current_instr");
	current_op_object = document.getElementById("current_op");
	
	pc_label_object = document.getElementById("pc_label");
	sp_label_object = document.getElementById("sp_label");
	sreg_label_object = document.getElementById("sreg_label");
	timer_1_label_object = document.getElementById("timer_1_label");
	
	tccr1a_label_object = document.getElementById("tccr1a_label");
	tccr1b_label_object = document.getElementById("tccr1b_label");
	tccr1c_label_object = document.getElementById("tccr1c_label");
	
	tccr1a_label_object.value = 0;
	tccr1b_label_object.value = 0;
	tccr1c_label_object.value = 0;
	
	for (var i=0; i<32; i++)
	{
		reg_label_objects[i] = document.getElementById("reg" + i);
	}

	
	for (var i=0; i<64; i++)
	{
		io_memory[i] = 0;
	}
	
	for (var i=0; i<160; i++)
	{
		ext_io_memory[i] = 0;
	}
	
	for (var i=0; i<2048; i++)
	{
		sram[i] = 0;
	}
	
	for (var i=0; i<1024; i++)
	{
		eeprom[i] = 0;
	}
	
	// Initial stack pointer value equals the last address of the internal SRAM
	//stack_ptr = 2047;
	var stack_ptr = 2303;
	io_memory[61] = stack_ptr & 255;
	io_memory[62] = (stack_ptr >> 8) & 255;
	// ??? Stack pointer must be set to point above start of sram ????
	// ??? This is taken care of as it points to zero. ???
	
	
	for (var i=0; i<32; i++)
	{
		registers[i] = 0;
	}
	
	for (var i=0; i<32; i++)
	{
		reg_label_objects[i].value = registers[i].toString(2);
	}
	update_debugger();
	//tv_init();
	return;
}

function name_current_instruction()
{
	// display name of current instruction
	current_instruction = instruction_name_table[PC];
}

function decode_instruction_name(opcode)
{

	if ((opcode >> 10 & 63) == 3)
	{
		//current_instruction = "ADD";
		return "ADD";
	}
	
	else if ((opcode >> 10 & 63) == 7)
	{
		//current_instruction = "ADC";
		return "ADC";
	}
	
	else if ((opcode >> 8 & 255) == 150)
	{
		//current_instruction = "ADIW";
		return "ADIW";
	}
	
	else if ((opcode >> 10 & 63) == 8)
	{
		//current_instruction = "AND";
		return "AND";
	}
	
	else if ((opcode >> 12 & 4095) == 7)
	{
		//current_instruction = "ANDI";
		return "ANDI";
	}
	
	else if ((opcode & 15) == 5 && (opcode >> 9 & 127) == 74)
	{
		//current_instruction = "ASR";
		return "ASR";
	}
	
	else if ((opcode & 15) == 8 && (opcode >>7 & 511) == 297)
	{
		//current_instruction = "BCLR";
		return "BCLR";
	}
	
	else if((opcode >> 3 & 1) == 0 && (opcode >> 9 & 127) == 124)
	{
		//current_instruction = "BLD";
		return "BLD";
	}
	
	else if ((opcode >> 10 & 63) == 61 && (opcode & 7) != 0)
	{
		//current_instruction = "BRBC";
		return "BRBC";
	}
	
	else if ((opcode >> 10 & 63) == 60 && (opcode & 7) != 0)
	{
		//current_instruction = "BRBS";
		return "BRBS";
	}
	
	else if ((opcode >> 10 & 63) == 61 && (opcode & 7) == 0)
	{
		//current_instruction = "BRCC";
		return "BRCC";
	}
	
	else if ((opcode >> 10 & 63) == 60 && (opcode & 7) == 0)
	{
		//current_instruction = "BRCS";
		return "BRCS";
	}
	
	else if ((opcode >> 7 & 511) == 296 && (opcode & 15) == 8)
	{
		//current_instruction = "BSET";
		return "BSET";
	}
	
	else if ((opcode >> 9 & 127) == 125 && (opcode >> 3 & 1) == 0)
	{
		//current_instruction = "BST";
		return "BST";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode >> 1 & 7) == 7)
	{
		//current_instruction = "CALL";
		return "CALL";
	}
	
	else if ((opcode >> 8 & 255) == 152)
	{
		//current_instruction = "CBI";
		return "CBI";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 0)
	{
		//current_instruction = "COM";
		return "COM";
	}
	
	else if ((opcode >> 10 & 63) == 5)
	{
		//current_instruction = "CP";
		return "CP";
	}
	
	else if ((opcode >> 10 & 63) == 1)
	{
		//current_instruction = "CPC";
		return "CPC";
	}
	
	else if ((opcode >> 12 & 15) == 3)
	{
		//current_instruction = "CPI";
		return "CPI";
	}
	
	else if ((opcode >> 10 & 63) == 4)
	{
		//current_instruction = "CPSE";
		return "CPSE";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 10)
	{
		//current_instruction = "DEC";
		return "DEC";
	}
	
	else if ((opcode >> 8 & 255) == 148 && (opcode & 15) == 11)
	{
		//current_instruction = "DES";
		return "DES";
	}
	
	else if ((opcode >> 10 & 63) == 9)
	{
		//current_instruction = "EOR";
		return "EOR";
	}
	
	else if (opcode == 38153)
	{
		//current_instruction = "ICALL";
		return "ICALL";
	}
	
	else if (opcode == 37897)
	{
		//current_instruction = "IJMP";
		return "IJMP";
	}
	
	else if ((opcode >> 11 & 31) == 22)
	{
		//current_instruction = "IN";
		return "IN";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 3)
	{
		//current_instruction = "INC";
		return "INC";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode >> 1 & 7) == 6)
	{
		//current_instruction = "JMP";
		return "JMP";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 12)
	{
		//current_instruction = "LD(X)";
		return "LD(X)";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 13)
	{
		//current_instruction = "LD(X+)";
		return "LD(X+)";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 10)
	{
		//current_instruction = "LD(-X)";
		return "LD(-X)";
	}
	
	else if ((opcode >> 9 & 127) == 64 && (opcode & 15) == 8)
	{
		//current_instruction = "LD(Y)";
		return "LD(Y)";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 9)
	{
		//current_instruction = "LD(Y+)";
		return "LD(Y+)";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 10)
	{
		//current_instruction = "LD(-Y)";
		return "LD(-Y)";
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 0 && (opcode >> 3 & 1) == 1)
	{
		//current_instruction = "LDD(Y+q)";
		return "LDD(Y+q)";
	}
	
	else if ((opcode >> 9 & 127) == 64 && (opcode & 15) == 0)
	{
		//current_instruction = "LD(Z)";
		return "LD(Z)";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 1)
	{
		//current_instruction = "LD(Z+)";
		return "LD(Z+)";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 2)
	{
		//current_instruction = "LD(-Z)";
		return "LD(-Z)";
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 0 && (opcode >> 3 & 1) == 0)
	{
		//current_instruction = "LDD(Z+q)";
		return "LDD(Z+q)";
	}
	
	else if ((opcode >> 12 & 15) == 14)
	{
		//current_instruction = "LDI";
		return "LDI";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 0)
	{
		//current_instruction = "LDS";
		return "LDS";
	}
	
	else if (opcode == 38344)
	{
		//current_instruction = "LPM";
		return "LPM";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 4)
	{
		//current_instruction = "LPM Rd, Z";
		return "LPM Rd, Z";
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 5)
	{
		//current_instruction = "LPM Rd, Z+";
		return "LPM Rd, Z+";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 6)
	{
		//current_instruction = "LSR";
		return "LSR";
	}
	
	else if ((opcode >> 10 & 63) == 11)
	{
		//current_instruction = "MOV";
		return "MOV";
	}
	
	else if ((opcode >> 8 & 255) == 1)
	{
		//current_instruction = "MOVW";
		return "MOVW";
	}
	
	else if ((opcode >> 10 & 63) == 39)
	{
		//current_instruction = "MUL";
		return "MUL";
	}
	
	else if ((opcode >> 8 & 255) == 2)
	{
		//current_instruction = "MULS";
		return "MULS";
	}
	
	else if ((opcode >> 7 & 511) == 6)
	{
		//current_instruction = "MULSU";
		return "MULSU";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 1)
	{
		//current_instruction = "NEG";
		return "NEG";
	}
	
	else if (opcode == 0)
	{
		//current_instruction = "NOP";
		return "NOP";
	}
	
	else if ((opcode >> 10 & 63) == 10)
	{
		//current_instruction = "OR";
		return "OR";
	}
	
	else if ((opcode >> 12 & 15) == 6)
	{
		//current_instruction = "ORI";
		return "ORI";
	}
	
	else if ((opcode >> 11 & 31) == 23)
	{
		var r = opcode >> 4 & 31;
		var a = (opcode >> 9 & 3) << 4 | (opcode & 15);
		//current_instruction = "OUT 0x" + a.toString(16) + " , 0x" + r.toString(16);
		return "OUT 0x" + a.toString(16) + " , 0x" + r.toString(16);
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 15)
	{
		//current_instruction = "POP";
		return "POP";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 15)
	{
		//current_instruction = "PUSH";
		return "PUSH";
	}
	
	else if ((opcode >> 12 & 15) == 13)
	{
		//current_instruction = "RCALL";
		return "RCALL";
	}
	
	else if (opcode == 38152)
	{
		//current_instruction = "RET";
		return "RET";
	}
	
	else if (opcode == 38168)
	{
		//current_instruction = "RETI";
		return "RETI";
	}
	
	else if ((opcode >> 12 & 15) == 12)
	{
		//current_instruction = "RJMP";
		return "RJMP";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 7)
	{
		//current_instruction = "ROR";
		return "ROR";
	}
	
	else if ((opcode >> 10 & 63) == 2)
	{
		//current_instruction = "SBC";
		return "SBC";
	}
	
	else if ((opcode >> 12 & 15) == 4)
	{
		//current_instruction = "SBCI";
		return "SBCI";
	}
	
	else if ((opcode >> 8 & 255) == 154)
	{
		//current_instruction = "SBI";
		return "SBI";
	}
	
	else if ((opcode >> 8 & 255) == 153)
	{
		//current_instruction = "SBIC";
		return "SBIC";
	}
	
	else if ((opcode >> 8 & 255) == 155)
	{
		//current_instruction = "SBIS";
		return "SBIS";
	}
	
	else if ((opcode >> 8 & 255) == 151)
	{
		//current_instruction = "SBIW";
		return "SBIW";
	}
	
	else if ((opcode >> 9 & 127) == 126 && (opcode >> 3 & 1) == 0)
	{
		//current_instruction = "SBRC";
		return "SBRC";
	}
	
	else if ((opcode >> 9 & 127) == 127 && (opcode >> 3 & 1) == 0)
	{
		//current_instruction = "SBRS";
		return "SBRS";
	}
	
	else if (opcode == 38280)
	{
		//current_instruction = "SLEEP";
		return "SLEEP";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 12)
	{
		//current_instruction = "ST(X)";
		return "ST(X)";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 13)
	{
		//current_instruction = "ST(X+)";
		return "ST(X+)";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 14)
	{
		//current_instruction = "ST(-X)";
		return "ST(-X)";
	}
	
	else if ((opcode >> 9 & 127) == 65 && (opcode & 15) == 8)
	{
		//current_instruction = "ST(Y)";
		return "ST(Y)";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 9)
	{
		//current_instruction = "ST(Y+)";
		return "ST(Y+)";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 10)
	{
		//current_instruction = "ST(-Y)";
		return "ST(-Y)";
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 1 && (opcode >> 3 & 1) == 1)
	{
		//current_instruction = "ST(Y+q)";
		return "ST(Y+q)";
	}
	
	else if ((opcode >> 9 & 127) == 65 && (opcode & 15) == 0)
	{
		////current_instruction = "ST(Z)";
		return "ST(Z)";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 1)
	{
		//current_instruction = "ST(Z+)";
		return "ST(Z+)";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 2)
	{
		//current_instruction = "ST(-Z)";
		return "ST(-Z)";
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 1 && (opcode >> 3 & 1) == 0)
	{
		//current_instruction = "ST(Z+q)";
		return "ST(Z+q)";
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 0)
	{
		//current_instruction = "STS";
		return "STS";
	}
	
	else if ((opcode >> 10 & 63) == 6)
	{
		//current_instruction = "SUB";
		return "SUB";
	}
	
	else if ((opcode >> 12 & 15) == 5)
	{
		//current_instruction = "SUBI";
		return "SUBI";
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 2)
	{
		//current_instruction = "SWAP";
		return "SWAP";
	}
	
	else if (opcode == 38312)
	{
		//current_instruction = "WDR";
		return "WDR";
	}
	
	else if ((opcode >> 4 & 31) == 73 && (opcode & 15) == 4)
	{
		//current_instruction = "XCH";
		return "XCH";
	}
	
	else
	{
		//current_instruction = "unknown";
		return "unknown";
	}
	
	
} // end decode_instruction_name(opcode)

function run_instruction()
{
	// Run decoded instruction
	//ins = decoded_rom[PC];
	//instruction_table[ins]();
	//debug_instruction_count[decoded_rom[PC]] = debug_instruction_count[decoded_rom[PC]] + 1;
	instruction_table[decoded_rom[PC]]();
		
	
} // end run_instruction()


function decode_instruction(opcode)
{
	
	if ((opcode >> 10 & 63) == 3)
	{
		//add();
		//current_instruction = "ADD";
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 7)
	{
		//adc();
		//current_instruction = "ADC";
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 150)
	{
		//adiw();
		//current_instruction = "ADIW";
		return 2;
	}
	
	else if ((opcode >> 10 & 63) == 8)
	{
		//logical_and();
		return 3;
	}
	
	else if ((opcode >> 12 & 4095) == 7)
	{
		//andi();
		return 4;
	}
	
	else if ((opcode & 15) == 5 && (opcode >> 9 & 127) == 74)
	{
		//asr();
		return 5;
	}
	
	else if ((opcode & 15) == 8 && (opcode >>7 & 511) == 297)
	{
		//bclr();
		return 6;
	}
	
	else if((opcode >> 3 & 1) == 0 && (opcode >> 9 & 127) == 124)
	{
		//bld();
		return 7;
	}
	
	else if ((opcode >> 10 & 63) == 61)
	{
		//brbc();
		// also handles brcc
		return 8;
	}
	
	else if ((opcode >> 10 & 63) == 60)
	{
		//brbs();
		// also handles brcs
		return 9;
	}
	
	else if ((opcode >> 7 & 511) == 296 && (opcode & 15) == 8)
	{
		//bset();
		return 10;
	}
	
	else if ((opcode >> 9 & 127) == 125 && (opcode >> 3 & 1) == 0)
	{
		//bst();
		return 11;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode >> 1 & 7) == 7)
	{
		//call();
		return 12;
	}
	
	else if ((opcode >> 8 & 255) == 152)
	{
		//cbi();
		return 13;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 0)
	{
		//com();
		return 14;
	}
	
	else if ((opcode >> 10 & 63) == 5)
	{
		//cp();
		return 15;
	}
	
	else if ((opcode >> 10 & 63) == 1)
	{
		//cpc();
		return 16;
	}
	
	else if ((opcode >> 12 & 15) == 3)
	{
		//cpi();
		return 17;
	}
	
	else if ((opcode >> 10 & 63) == 4)
	{
		//cpse();
		return 18;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 10)
	{
		//dec();
		return 19;
	}
	
	else if ((opcode >> 8 & 255) == 148 && (opcode & 15) == 11)
	{
		//des();
		return 20;
	}
	
	else if ((opcode >> 10 & 63) == 9)
	{
		//eor();
		return 21;
	}
	
	else if (opcode == 38153)
	{
		//icall();
		return 22;
	}
	
	else if (opcode == 37897)
	{
		//ijmp();
		return 23;
	}
	
	else if ((opcode >> 11 & 31) == 22)
	{
		//avr_in();
		return 24;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 3)
	{
		//inc();
		return 25;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode >> 1 & 7) == 6)
	{
		//jmp();
		return 26;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 12)
	{
		//ld_x_1();
		return 27;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 13)
	{
		//ld_x_2();
		return 28;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 10)
	{
		//ld_x_3();
		return 29;
	}
	
	else if ((opcode >> 9 & 127) == 64 && (opcode & 15) == 8)
	{
		//ld_y_1();
		return 30;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 9)
	{
		//ld_y_2();
		return 31;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 10)
	{
		//ld_y_3();
		return 32;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 0 && (opcode >> 3 & 1) == 1)
	{
		//ld_y_4();
		return 33;
	}
	
	else if ((opcode >> 9 & 127) == 64 && (opcode & 15) == 0)
	{
		//ld_z_1();
		return 34;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 1)
	{
		//ld_z_2();
		return 35;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 2)
	{
		//ld_z_3();
		return 36;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 0 && (opcode >> 3 & 1) == 0)
	{
		//ld_z_4();
		return 37;
	}
	
	else if ((opcode >> 12 & 15) == 14)
	{
		//ldi();
		return 38;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 0)
	{
		//lds();
		return 39;
	}
	
	else if (opcode == 38344)
	{
		//lpm_1();
		return 40;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 4)
	{
		//lpm_2();
		return 41;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 5)
	{
		//lpm_3();
		return 42;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 6)
	{
		//lsr();
		return 43;
	}
	
	else if ((opcode >> 10 & 63) == 11)
	{
		//mov();
		return 44;
	}
	
	else if ((opcode >> 8 & 255) == 1)
	{
		//movw();
		return 45;
	}
	
	else if ((opcode >> 10 & 63) == 39)
	{
		//mul();
		return 46;
	}
	
	else if ((opcode >> 8 & 255) == 2)
	{
		//muls();
		return 47;
	}
	
	else if ((opcode >> 7 & 511) == 6)
	{
		//mulsu();
		return 48;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 1)
	{
		//neg();
		return 49;
	}
	
	else if (opcode == 0)
	{
		//nop();
		return 50;
	}
	
	else if ((opcode >> 10 & 63) == 10)
	{
		//or();
		return 51;
	}
	
	else if ((opcode >> 12 & 15) == 6)
	{
		//ori();
		return 52;
	}
	
	else if ((opcode >> 11 & 31) == 23)
	{
		//out();
		return 53;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 15)
	{
		//pop();
		return 54;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 15)
	{
		//push();
		return 55;
	}
	
	else if ((opcode >> 12 & 15) == 13)
	{
		//r_call();
		return 56;
	}
	
	else if (opcode == 38152)
	{
		//ret();
		return 57;
	}
	
	else if (opcode == 38168)
	{
		//reti();
		return 58;
	}
	
	else if ((opcode >> 12 & 15) == 12)
	{
		//rjmp();
		return 59;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 7)
	{
		//ror();
		return 60;
	}
	
	else if ((opcode >> 10 & 63) == 2)
	{
		//sbc();
		return 61;
	}
	
	else if ((opcode >> 12 & 15) == 4)
	{
		//sbci();
		return 62;
	}
	
	else if ((opcode >> 8 & 255) == 154)
	{
		//sbi();
		return 63;
	}
	
	else if ((opcode >> 8 & 255) == 153)
	{
		//sbic();
		return 64;
	}
	
	else if ((opcode >> 8 & 255) == 155)
	{
		//sbis();
		return 65;
	}
	
	else if ((opcode >> 8 & 255) == 151)
	{
		//sbiw();
		return 66;
	}
	
	else if ((opcode >> 9 & 127) == 126 && (opcode >> 3 & 1) == 0)
	{
		//sbrc();
		return 67;
	}
	
	else if ((opcode >> 9 & 127) == 127 && (opcode >> 3 & 1) == 0)
	{
		//sbrs();
		return 68;
	}
	
	else if (opcode == 38280)
	{
		//sleep();
		return 69;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 12)
	{
		//st_x_1();
		return 70;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 13)
	{
		//st_x_2();
		return 71;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 14)
	{
		//st_x_3();
		return 72;
	}
	
	else if ((opcode >> 9 & 127) == 65 && (opcode & 15) == 8)
	{
		//st_y_1();
		return 73;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 9)
	{
		//st_y_2();
		return 74;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 10)
	{
		//st_y_3();
		return 75;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 1 && (opcode >> 3 & 1) == 1)
	{
		//st_y_4();
		return 76;
	}
	
	else if ((opcode >> 9 & 127) == 65 && (opcode & 15) == 0)
	{
		//st_z_1();
		return 77;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 1)
	{
		//st_z_2();
		return 78;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 2)
	{
		//st_z_3();
		return 79;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 1 && (opcode >> 3 & 1) == 0)
	{
		//st_z_4();
		return 80;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 0)
	{
		//sts();
		return 81;
	}
	
	else if ((opcode >> 10 & 63) == 6)
	{
		//sub();
		return 82;
	}
	
	else if ((opcode >> 12 & 15) == 5)
	{
		//subi();
		return 83;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 2)
	{
		//swap();
		return 84;
	}
	
	else if (opcode == 38312)
	{
		//wdr();
		return 85;
	}
	
	else if ((opcode >> 4 & 31) == 73 && (opcode & 15) == 4)
	{
		//xch();
		return 86;
	}
	
	
	else
	{
		//alert("Invalid instruction 0x" + rom[PC].toString(16));
		return -1;
	}
		

} // end decode_instruction(opcode)

function get_words(opcode)
{
	
	if ((opcode >> 10 & 63) == 3)
	{
		//add();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 7)
	{
		//adc();
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 150)
	{
		//adiw();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 8)
	{
		//logical_and();
		return 1;
	}
	
	else if ((opcode >> 12 & 4095) == 7)
	{
		//andi();
		return 1;
	}
	
	else if ((opcode & 15) == 5 && (opcode >> 9 & 127) == 74)
	{
		//asr();
		return 1;
	}
	
	else if ((opcode & 15) == 8 && (opcode >>7 & 511) == 297)
	{
		//bclr();
		return 1;
	}
	
	else if((opcode >> 3 & 1) == 0 && (opcode >> 9 & 127) == 124)
	{
		//bld();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 61)
	{
		//brbc();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 60)
	{
		//brbs();
		return 1;
	}
	
	else if ((opcode >> 7 & 511) == 296 && (opcode & 15) == 8)
	{
		//bset();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 125 && (opcode >> 3 & 1) == 0)
	{
		//bst();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode >> 1 & 7) == 7)
	{
		//call();
		return 2;
	}
	
	else if ((opcode >> 8 & 255) == 152)
	{
		//cbi();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 0)
	{
		//com();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 5)
	{
		//cp();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 1)
	{
		//cpc();
		return 1;
	}
	
	else if ((opcode >> 12 & 15) == 3)
	{
		//cpi();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 4)
	{
		//cpse();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 10)
	{
		//dec();
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 148 && (opcode & 15) == 11)
	{
		//des();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 9)
	{
		//eor();
		return 1;
	}
	
	else if (opcode == 38153)
	{
		//icall();
		return 1;
	}
	
	else if (opcode == 37897)
	{
		//ijmp();
		return 1;
	}
	
	else if ((opcode >> 11 & 31) == 22)
	{
		//avr_in();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 3)
	{
		//inc();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode >> 1 & 7) == 6)
	{
		//jmp();
		return 2;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 12)
	{
		//ld_x_1();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 13)
	{
		//ld_x_2();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 10)
	{
		//ld_x_3();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 64 && (opcode & 15) == 8)
	{
		//ld_y_1();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 9)
	{
		//ld_y_2();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 10)
	{
		//ld_y_3();
		return 1;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 0 && (opcode >> 3 & 1) == 1)
	{
		//ld_y_4();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 64 && (opcode & 15) == 0)
	{
		//ld_z_1();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 1)
	{
		//ld_z_2();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 2)
	{
		//ld_z_3();
		return 1;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 0 && (opcode >> 3 & 1) == 0)
	{
		//ld_z_4();
		return 1;
	}
	
	else if ((opcode >> 12 & 15) == 14)
	{
		//ldi();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 0)
	{
		//lds();
		return 2;
	}
	
	else if (opcode == 38344)
	{
		//lpm_1();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 4)
	{
		//lpm_2();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 5)
	{
		//lpm_3();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 6)
	{
		//lsr();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 11)
	{
		//mov();
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 1)
	{
		//movw();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 39)
	{
		//mul();
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 2)
	{
		//muls();
		return 1;
	}
	
	else if ((opcode >> 7 & 511) == 6)
	{
		//mulsu();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 1)
	{
		//neg();
		return 1;
	}
	
	else if (opcode == 0)
	{
		//nop();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 10)
	{
		//or();
		return 1;
	}
	
	else if ((opcode >> 12 & 15) == 6)
	{
		//ori();
		return 1;
	}
	
	else if ((opcode >> 11 & 31) == 23)
	{
		//out();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 15)
	{
		//pop();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 15)
	{
		//push();
		return 1;
	}
	
	else if ((opcode >> 12 & 15) == 13)
	{
		//r_call();
		return 1;
	}
	
	else if (opcode == 38152)
	{
		//ret();
		return 1;
	}
	
	else if (opcode == 38168)
	{
		//reti();
		return 1;
	}
	
	else if ((opcode >> 12 & 15) == 12)
	{
		//rjmp();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 7)
	{
		//ror();
		return 1;
	}
	
	else if ((opcode >> 10 & 63) == 2)
	{
		//sbc();
		return 1;
	}
	
	else if ((opcode >> 12 & 15) == 4)
	{
		//sbci();
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 154)
	{
		//sbi();
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 153)
	{
		//sbic();
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 155)
	{
		//sbis();
		return 1;
	}
	
	else if ((opcode >> 8 & 255) == 151)
	{
		//sbiw();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 126 && (opcode >> 3 & 1) == 0)
	{
		//sbrc();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 127 && (opcode >> 3 & 1) == 0)
	{
		//sbrs();
		return 1;
	}
	
	else if (opcode == 38280)
	{
		//sleep();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 12)
	{
		//st_x_1();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 127 && (opcode & 15) == 13)
	{
		//st_x_2();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 14)
	{
		//st_x_3();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 65 && (opcode & 15) == 8)
	{
		//st_y_1();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 9)
	{
		//st_y_2();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 10)
	{
		//st_y_3();
		return 1;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 1 && (opcode >> 3 & 1) == 1)
	{
		//st_y_4();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 65 && (opcode & 15) == 0)
	{
		//st_z_1();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 1)
	{
		//st_z_2();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 2)
	{
		//st_z_3();
		return 1;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 1 && (opcode >> 3 & 1) == 0)
	{
		//st_z_4();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 0)
	{
		//sts();
		return 2;
	}
	
	else if ((opcode >> 10 & 63) == 6)
	{
		//sub();
		return 1;
	}
	
	else if ((opcode >> 12 & 15) == 5)
	{
		//subi();
		return 1;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 2)
	{
		//swap();
		return 1;
	}
	
	else if (opcode == 38312)
	{
		//wdr();
		return 1;
	}
	
	else if ((opcode >> 4 & 31) == 73 && (opcode & 15) == 4)
	{
		//xch();
		return 1;
	}
	
}// end get_words()
	
			

// ------------------------ Instruction set ---------------------------------

instruction_table[1] = function adc()
{
	var opcode = rom[PC];
	var rr = (opcode>>9 & 1) << 4 | opcode & 15;
	var rd = (opcode>>4) & 31;
	
	// status register
	var rd_7 = registers[rd] >> 7 & 1;
	var rr_7 = registers[rr] >> 7 & 1;
	
	var rd_3 = registers[rd] >> 3 & 1;
	var rr_3 = registers[rr] >> 3 & 1;
	
	
	// Add with carry
	
	registers[rd] = (registers[rd] + registers[rr] + (io_memory[63] & 1)) & 255;
	
	// Status register continued
	var r = registers[rd];
	var r_7 = r >> 7  & 1;
	var r_3 = r >> 3 & 1;
	
	var v_bit = rd_7 & rr_7 & (~r_7 & 1) | (~rd_7 & 1) & (~rr_7 & 1) & r_7;
	
	var n_bit = r_7;
	
	var s_bit = (n_bit ^ v_bit) & 1;
	
	var h_bit = rd_3 & rr_3 | rr_3 & (~r_3 & 1) | (~r_3 & 1) & rd_3;	
	
	var z_bit = 0;
	if (r == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = rd_7 & rr_7 | rr_7 & (~r_7 & 1) | (~r_7 & 1) & rd_7;
	
	var i_bit = io_memory[63] >> 7;
	var t_bit = io_memory[63] >> 6;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	PC++;
	cycles++;
} // end adc()


instruction_table[0] = function add()
{
	var opcode = rom[PC];
	var rr = (opcode>>9 & 1) << 4 | (opcode & 15);
	var rd = (opcode>>4) & 31;
	

	
	// status register
	var rd_7 = (registers[rd] >> 7) & 1;
	var rr_7 = (registers[rr] >> 7) & 1;
	
	var rd_3 = (registers[rd] >> 3) & 1;
	var rr_3 = (registers[rr] >> 3) & 1;
	
	// Add without carry
	registers[rd] = (registers[rd] + registers[rr]) & 255;
	
	// Status register continued
	var r = registers[rd];
	var r_7 = (r >> 7)  & 1;
	var r_3 = (r >> 3) & 1;
	
	var v_bit = rd_7 & rr_7 & (~r_7 & 1) | (~rd_7 & 1) & (~rr_7 & 1) & r_7;
	
	var n_bit = r_7;
	
	var s_bit = (n_bit ^ v_bit) & 1;
	
	var h_bit = rd_3 & rr_3 | rr_3 & (~r_3 & 1) | (~r_3 & 1) & rd_3;
	
	
	var z_bit = 0;
	if (r == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = rd_7 & rr_7 | rr_7 & (~r_7 & 1) | (~r_7 & 1) & rd_7;
	
	var i_bit = io_memory[63] >>7 & 1;
	var t_bit = io_memory[63] >>6 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	PC++;
	cycles++;
} // end add()

instruction_table[2] = function adiw()
{
	var operands = rom[PC] & 255;
	var k = ((operands >>6 & 3) << 4) | operands & 15;
	var d = (operands >> 4) & 3;
	var c_bit = 0;
	var z_bit = 0;
	var n_bit = 0;
	var v_bit = 0;
	var s_bit = 0;
	var temp_reg = 0;
	switch (d)
	{
		case 0:
			temp_reg = (registers[24] | registers[25] << 8) + k;
			registers[24] = temp_reg & 255;
			registers[25] = temp_reg >> 8 & 255;
			c_bit = ((~temp_reg >> 15 & 1) & 1) & (registers[25] >> 7 & 1) & 1;
			v_bit = (~(registers[25] >> 7 & 1) & 1) & (temp_reg >> 15 & 1) & 1;
			break;
			
		case 1:
			temp_reg = (registers[26] | registers[27] << 8) + k;
			registers[26] = temp_reg & 255;
			registers[27] = temp_reg >> 8 & 255;
			c_bit = ((~temp_reg >> 15 & 1) & 1) & (registers[27] >> 7 & 1) & 1;
			v_bit = (~(registers[27] >> 7 & 1) & 1) & (temp_reg >> 15 & 1) & 1;
			break;
			
		case 2:
			temp_reg = (registers[28] | registers[29] << 8) + k;
			registers[28] = temp_reg & 255;
			registers[29] = temp_reg >> 8 & 255;
			c_bit = ((~temp_reg >> 15 & 1) & 1) & (registers[29] >> 7 & 1) & 1;
			v_bit = (~(registers[29] >> 7 & 1) & 1) & (temp_reg >> 15 & 1) & 1;
			break;
			
		case 3:
			temp_reg = (registers[30] | registers[31] << 8) + k;
			registers[30] = temp_reg & 255;
			registers[31] = temp_reg >> 8 & 255;
			c_bit = ((~temp_reg >> 15 & 1) & 1) & (registers[31] >> 7 & 1) & 1;
			v_bit = (~(registers[31] >> 7 & 1) & 1) & (temp_reg >> 15 & 1) & 1;
			break;
			
		default:
			break;
	}

	if (temp_reg == 0)
	{
		z_bit = 1;
	}
	n_bit = temp_reg >> 15 & 1;
	s_bit = (n_bit ^ v_bit) & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;


	PC++;
	cycles = cycles + 2;		
} // end adiw()

instruction_table[3] = function logical_and()
{
	var opcode = rom[PC];
	var rr = (opcode>>9 & 1) << 4 | (opcode & 15);
	var rd = (opcode>>4) & 31;
	
	var z_bit = 0;
	var n_bit = 0;
	
	var v_bit = io_memory[63] >> 3 & 1;
	
	var s_bit = 0;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	var c_bit = io_memory[63] & 1;
	
	//Logical AND
	registers[rd] = registers[rd] & registers[rr] & 255;
	
	if (registers[rd] == 0)
	{
		z_bit = 1;
	}
	
	n_bit = registers[rd] >> 7 & 1;
	
	s_bit = (n_bit ^ v_bit) & 1;
	
	v_bit = 0;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
} // end logical_and()

instruction_table[4] = function andi()
{
	var opcode = rom[PC];
	var k = (opcode >> 8 & 15) << 4 | opcode & 15;
	var d = opcode >> 4 & 15;
	
	//AND with immediate
	registers[d+16] = registers[d+16] & k & 255;
	
	var h_bit = io_memory[63] >> 5 &1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	var c_bit = io_memory[63] & 1;
	var v_bit = 0;
	var z_bit = 0;
	if (registers[d+16] == 0)
	{
		z_bit = 1;
	}
	var n_bit = registers[d+16] >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
} // end andi()

instruction_table[5] = function asr()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var msb = registers[d] >> 7 & 1;
	var c_bit = registers[d] & 1;
	var z_bit = 0;
	var h_bit = io_memory[63] >> 5 &1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;

	
	// Shift
	var temp_reg = registers[d] >> 1;
	
	msb = msb << 7;
	temp_reg = temp_reg | msb;
	
	registers[d] = temp_reg;
	
	if (registers[d] == 0)
	{
		z_bit = 1;
	}
	
	var n_bit = registers[d] >> 7 & 1;
	var c_after_bit = registers[d] & 1;
	
	var v_bit = (n_bit ^ c_bit) & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
	
} // end asr()

instruction_table[6] = function bclr()
{
	var opcode = rom[PC];
	var s = opcode >> 4 & 7;
	
	// clear bit in SREG
	var mask = 1 << s;
	mask = ~mask & 255;
	io_memory[63] = io_memory[63] & mask;
	
	PC++;
	cycles++;

}// end bclr()

instruction_table[7] = function bld()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var b = opcode & 7;
	
	var bit = io_memory[63] >> 6 & 1;
	var reg_data = bit << b;
	
	var original_reg_data = registers[d];

	if ((original_reg_data >> b & 1) == 0)
	{
	  //if original bit is zero and new bit is zero, no change is needed
	  
	  //if original bit is zero but new bit is one, set the bit in the register to 1
	  if (bit == 1)
	  {
	    registers[d] = registers[d] | (1 << b);
	  }
	}
	
	else if ((original_reg_data >> b & 1) == 1)
	{
	  //if original bit is one and new bit is one, no change is needed
	  
	  //if original bit is one but new bit is zero....
	  if (bit == 0)
	  {
	    //...calculate the new bitmask
	    var mask = 1 << b;
	    mask = (~mask) & 255;
	    
	    //...apply the bitmask
	    registers[d] = registers[d] & mask;
	  }
	}
	
	PC++;
	cycles++;
	
}// end bld()

instruction_table[8] = function brbc()
{
	var opcode = rom[PC];
	var k = opcode >> 3 & 127;
	var s = opcode & 7;
	// Branch if Bit in SREG is cleared
	if ((io_memory[63] >> s & 1) == 0)
	{
		// convert from two's complement
		if (k > 63)
		{
			k = -1*((~k & 127)  + 1);
		}

		PC = PC + k + 1;
		cycles = cycles + 2;
	}
	else
	{
		PC++;
		cycles++;
	}
	
}// end brbc

instruction_table[9] = function brbs()
{
	var opcode = rom[PC];
	var k = opcode >> 3 & 127;
	var s = opcode & 7;
	// Branch if Bit in SREG is set
	if ((io_memory[63] >> s & 1) == 1)
	{
		// convert from two's complement
		if (k > 63)
		{
			k = -1*((~k & 127)  + 1);
		}
		PC = PC + k + 1;
		cycles = cycles + 2;
	}
	else
	{
		PC++;
		cycles++;
	}
	
}// end brbs

instruction_table[10] = function bset()
{
	var opcode = rom[PC];
	var s = (opcode >> 4) & 7;
	var mask = 1 << s;
	io_memory[63] = io_memory[63] | mask;
	
	PC++;
	cycles++;
	
}// end bset()

instruction_table[11] = function bst()
{
	var opcode = rom[PC];
	var d = (opcode >> 4) & 31;
	var b = opcode & 7;
	
	var c_bit = io_memory[63] & 1;
	var z_bit = io_memory[63] >> 1 & 1;
	var n_bit = io_memory[63] >> 2 & 1;
	var v_bit = io_memory[63] >> 3 & 1;
	var s_bit = io_memory[63] >> 4 & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = registers[d] >> b & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
	
}// end bst()

instruction_table[12] = function call()
{
	var opcode_1 = rom[PC];
	var opcode_2 = rom[PC + 1];
	var k = (opcode_1 >> 4 & 31) << 17 | (opcode_1 & 1) << 16 | opcode_2 & 65535;
	
	var stack = PC + 2;
	// debug start
	//document.getElementById("last_call_label").value = stack;
	//stack_dump();
	// debug end
	var stack_pointer = (io_memory[62] << 8 | io_memory[61]) - 256;
	sram[stack_pointer] = stack >> 8 & 255;
	sram[stack_pointer-1] = stack & 255;
	stack_pointer = stack_pointer - 2 + 256;
	io_memory[61] = stack_pointer & 255;
	io_memory[62] = (stack_pointer >> 8) & 255;
	
	PC = k;
	
	cycles = cycles + 4;

}// end call()


instruction_table[13] = function cbi()
{
	var opcode = rom[PC];
	
	var a = opcode >> 3 & 31;
	var b = opcode & 7;
	
	var byte = io_memory[a];
	
	var mask = 1 << b;
	mask = (~mask) & 255;
	
	byte = byte & mask;
	
	io_memory[a] = byte;
	
	PC++;
	cycles = cycles + 2;

}  //end cbi()

instruction_table[14] = function com()
{
	var opcode = rom[PC];
	
	var c_bit = 1;

	var v_bit = 0;

	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	var d = opcode >> 4 & 31;
	
	registers[d] = (~registers[d]) & 255;
	
	var n_bit = registers[d] >> 7 & 1;
	
	var z_bit = 0;
	
	if (registers[d] == 0)
	{
		z_bit = 1;
	}
	
	var s_bit = (n_bit ^ v_bit) & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
	
} // end com()


instruction_table[15] = function cp()
{
	var opcode = rom[PC];
	
	var r = (opcode >> 9 & 1) << 4 | (opcode & 15);
	var d = opcode >> 4 & 31;
	
	var temp = (registers[d] - registers[r]) & 255;
	
	var rd_3 = registers[d] >> 3 & 1;
	var rr_3 = registers[r] >> 3 & 1;
	var r_3 = temp >> 3 & 1;
	
	var rd_7 = registers[d] >> 7 & 1;
	var rr_7 = registers[r] >> 7 & 1;
	var r_7 = temp >> 7 & 1;
	
	
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	var h_bit = ((~rd_3) & 1) & rr_3 | rr_3 & r_3 | r_3 & ((~rd_3) & 1);
	var v_bit = rd_7 & ((~rr_7) & 1) & ((~r_7) & 1) | ((~rd_7) & 1) & rr_7 & r_7;
	var n_bit = r_7;
	var z_bit = 0;
	
	if (temp == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = ((~rd_7) & 1) & rr_7 | rr_7 & r_7 | r_7 & ((~rd_7) & 1);
	var s_bit = (n_bit ^ v_bit) & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	
	PC++;
	cycles++;


} // end cp()

instruction_table[16] = function cpc()
{
	var opcode = rom[PC];
	
	var r = (opcode >> 9 & 1) << 4 | (opcode & 15);
	var d = opcode >> 4 & 31;
	
	var temp = (registers[d] - registers[r] - (io_memory[63] & 1) ) & 255;
	
	var rd_3 = registers[d] >> 3 & 1;
	var rr_3 = registers[r] >> 3 & 1;
	var r_3 = temp >> 3 & 1;
	
	var rd_7 = registers[d] >> 7 & 1;
	var rr_7 = registers[r] >> 7 & 1;
	var r_7 = temp >> 7 & 1;
	
	
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	var h_bit = ((~rd_3) & 1) & rr_3 | rr_3 & r_3 | r_3 & ((~rd_3) & 1);
	var v_bit = rd_7 & ((~rr_7) & 1) & ((~r_7) & 1) | ((~rd_7) & 1) & rr_7 & r_7;
	var n_bit = r_7;
	var z_bit = 0;
	
	if (temp == 0)
	{
		// Previous value remains unchanged when the result is zero
		z_bit = io_memory[63] >> 1 & 1; 
	}
	
	var c_bit = ((~rd_7) & 1) & rr_7 | rr_7 & r_7 | r_7 & ((~rd_7) & 1);
	var s_bit = (n_bit ^ v_bit) & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
} // end cpc()

instruction_table[17] = function cpi()
{
	var opcode = rom[PC];
	
	var k = (opcode >> 8 & 15) << 4 | (opcode & 15);
	var d = (opcode >> 4) & 15;
	
	var temp = registers[d+16] - k;
	
	var rd_3 = registers[d+16] >> 3 & 1;
	var k_3 = k >> 3 & 1;
	var r_3 = temp >> 3 & 1;
	var rd_7 = registers[d+16] >> 7 & 1;
	var k_7 = k >> 7 & 1;
	var r_7 = temp >> 7 & 1;
	
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	var h_bit = ((~rd_3) & 1) & k_3 | k_3 & r_3 | r_3 & ((~rd_3) & 1);
	var v_bit = rd_7 & ((~k_7) & 1) & ((~r_7) & 1) | ((~rd_7) & 1) & k_7 & r_7;
	var n_bit = r_7;
	var z_bit = 0;
	if (temp == 0)
	{
		z_bit = 1;
	}

	var c_bit = ((~rd_7) & 1) & k_7 | k_7 & r_7 | r_7 & ((~rd_7) & 1);
	var s_bit = (n_bit ^ v_bit) & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
	
} // end cpi()

instruction_table[18] = function cpse()
{
	var opcode = rom[PC];
	var r = (opcode >> 9 & 1) << 4 | (opcode & 15);
	var d = opcode >> 4 & 31;
	
	var next_instruction_words = get_words(rom[PC + 1]);
	
	registers[r] = registers[r] & 255;
	registers[d] = registers[d] & 255;
	
	if ((next_instruction_words == 1) && (registers[r] == registers[d]))
	{
		PC = PC + 2;
		cycles = cycles + 2;
	}
	
	else if ((next_instruction_words == 2) && (registers[r] == registers[d]))
	{
		PC = PC + 3;
		cycles = cycles + 3;
	}
	
	else
	{
		PC++;
		cycles++;
	}
	
}// end cpse()


instruction_table[19] = function dec()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	registers[d] = (registers[d] - 1) & 255;
	
	var z_bit = 0;
	if (registers[d] == 0)
	{
		z_bit = 1;
	}
	
	var n_bit = registers[d] >> 7 & 1;
	
	var v_bit = (~n_bit & 1) & (registers[d] >> 6 & 1) & (registers[d] >> 5 & 1) & (registers[d] >> 4 & 1) & (registers[d] >> 3 & 1) & (registers[d] >> 2 & 1) & (registers[d] >> 1 & 1) & (registers[d] & 1) & 1;
	
	var s_bit = (n_bit ^ v_bit) & 1;
	
	var c_bit = io_memory[63] & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
	
} // end dec()

instruction_table[20] = function des()
{
	//Not implemented yet!
	var opcode = rom[PC - 1];
	if ((opcode >> 8 & 255) != 148 && (opcode & 15) != 11)
	{
		cycles = cycles + 2;
	}
	else
	{
		cycles++;
	}
	
	PC++;
	
}// end des()

// EICALL not available on Arduino.
// EIJMP not available on Arduino.
// ELMP not available on Arduino.

instruction_table[21] = function eor()
{
	var opcode = rom[PC];
	var r = (opcode >> 9 & 1) << 4 | opcode & 15;
	var d = opcode >> 4 & 31;
	
	// perform exclusive OR
	registers[d] = (registers[d] ^ registers[r]) & 255;
	
	var v_bit = 0;
	var n_bit = registers[d] >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (registers[d] == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = io_memory[63] & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	cycles++;
	PC++;

} // end eor()

// FMUL not implemented
// FMULS not implemented
// FMULSU not implemented

instruction_table[22] = function icall()
{
	var stack = PC + 1;
	var stack_pointer = (io_memory[62] << 8 | io_memory[61]) - 256;
	sram[stack_pointer] = stack >> 8 & 255;
	sram[stack_pointer - 1] = stack & 255
	stack_pointer = stack_pointer - 2 + 256;
	io_memory[61] = stack_pointer & 255;
	io_memory[62] = (stack_pointer >> 8) & 255;
	
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	PC = z_pointer;
	
	cycles = cycles + 3;
	
}// end icall()

instruction_table[23] = function ijmp()
{
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	PC = z_pointer;
	
	cycles = cycles + 2;
	
}// end ijmp()

instruction_table[24] = function avr_in()
{
	var opcode = rom[PC];
	var a = (opcode >> 9 & 3) << 4 | opcode & 15;
	var d = opcode >> 4 & 31;
	
	registers[d] = io_memory[a];
	
	PC++;
	cycles++;
	
}// end avr_in()

instruction_table[25] = function inc()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	registers[d] = (registers[d] + 1) & 255;
	
	var n_bit = registers[d] >> 7 & 1;
	
	var v_bit = (n_bit & 1) & (~(registers[d] >> 6 & 1) & 1) & (~(registers[d] >> 5 & 1) & 1) & (~(registers[d] >> 4 & 1) & 1) & (~(registers[d] >> 3 & 1) & 1) & (~(registers[d] >> 2 & 1) & 1) & (~(registers[d] >> 1 & 1) & 1) & (~(registers[d] & 1) & 1) & 1;
	
	var s_bit = (n_bit ^ v_bit) & 1;
	
	var z_bit = 0;
	if (registers[d] == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = io_memory[63] & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
	
}// end inc()

instruction_table[26] = function jmp()
{
	var opcode_1 = rom[PC];
	var opcode_2 = rom[PC + 1];
	var k = (opcode_1 >> 4 & 31) << 17 | (opcode_1 & 1) << 16 | opcode_2;
	
	PC = k;
	
	cycles = cycles + 3;
	
}// end jmp

instruction_table[27] = function ld_x_1()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var x_pointer = registers[27] << 8 | registers[26] & 255;
	
	if (x_pointer <= 31)
	{
		// load from register
		registers[d] = registers[x_pointer];
	}
	else if (x_pointer > 31 && x_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[x_pointer - 32];
	}
	else if (x_pointer > 95 && x_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[x_pointer - 96];
	}
	else if (x_pointer > 255)
	{
		// load from sram
		registers[d] = sram[x_pointer - 256];
	}
	
	PC++;
	
	cycles++;
	
} // end ld_x_1()

instruction_table[28] = function ld_x_2()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var x_pointer = registers[27] << 8 | registers[26] & 255;
	
	if (x_pointer <= 31)
	{
		// load from register
		registers[d] = registers[x_pointer];
	}
	else if (x_pointer > 31 && x_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[x_pointer - 32];
	}
	else if (x_pointer > 95 && x_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[x_pointer - 96];
	}
	else if (x_pointer > 255)
	{
		// load from sram
		registers[d] = sram[x_pointer - 256];
	}
	
	x_pointer = (x_pointer + 1) & 65535;
	
	registers[27] = x_pointer >> 8 & 255;
	registers[26] = x_pointer & 255
	
	PC++;
	
	cycles = cycles + 2;
	
} // end ld_x_2()

instruction_table[29] = function ld_x_3()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var x_pointer = registers[27] << 8 | registers[26] & 255;
	x_pointer = (x_pointer - 1) & 65535;
	
	if (x_pointer <= 31)
	{
		// load from register
		registers[d] = registers[x_pointer];
	}
	else if (x_pointer > 31 && x_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[x_pointer - 32];
	}
	else if (x_pointer > 95 && x_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[x_pointer - 96];
	}
	else if (x_pointer > 255)
	{
		// load from sram
		registers[d] = sram[x_pointer - 256];
	}
	
	
	
	registers[27] = x_pointer >> 8 & 255;
	registers[26] = x_pointer & 255
	
	PC++;
	
	cycles = cycles + 3;
	
} // end ld_x_3()

instruction_table[30] = function ld_y_1()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var y_pointer = registers[29] << 8 | registers[28] & 255;
	
	if (y_pointer <= 31)
	{
		// load from register
		registers[d] = registers[y_pointer];
	}
	else if (y_pointer > 31 && y_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[y_pointer - 32];
	}
	else if (y_pointer > 95 && y_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[y_pointer - 96];
	}
	else if (y_pointer > 255)
	{
		// load from sram
		registers[d] = sram[y_pointer - 256];
	}
	
	PC++;
	
	cycles++;
	
} // end ld_y_1()

instruction_table[31] = function ld_y_2()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var y_pointer = registers[29] << 8 | registers[28] & 255;
	
	if (y_pointer <= 31)
	{
		// load from register
		registers[d] = registers[y_pointer];
	}
	else if (y_pointer > 31 && y_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[y_pointer - 32];
	}
	else if (y_pointer > 95 && y_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[y_pointer - 96];
	}
	else if (y_pointer > 255)
	{
		// load from sram
		registers[d] = sram[y_pointer - 256];
	}
	
	y_pointer = (y_pointer + 1) & 65535;
	
	registers[29] = y_pointer >> 8 & 255;
	registers[28] = y_pointer & 255
	
	PC++;
	
	cycles = cycles + 2;
	
} // end ld_y_2()

instruction_table[32] = function ld_y_3()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var y_pointer = registers[29] << 8 | registers[28] & 255;
	y_pointer = (y_pointer - 1) & 65535;
	
	if (y_pointer <= 31)
	{
		// load from register
		registers[d] = registers[y_pointer];
	}
	else if (y_pointer > 31 && y_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[y_pointer - 32];
	}
	else if (y_pointer > 95 && y_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[y_pointer - 96];
	}
	else if (y_pointer > 255)
	{
		// load from sram
		registers[d] = sram[y_pointer - 256];
	}
	
	
	
	registers[29] = y_pointer >> 8 & 255;
	registers[28] = y_pointer & 255
	
	PC++;
	
	cycles = cycles + 3;
	
} // end ld_y_3()

instruction_table[33] = function ld_y_4()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var q = (opcode >> 13 & 1) << 5 | (opcode >> 10 & 3) << 3 | (opcode & 7);
	
	var y_pointer = registers[29] << 8 | registers[28] & 255;
	
	y_pointer = (y_pointer + q) & 65535;
	
	if (y_pointer <= 31)
	{
		// load from register
		registers[d] = registers[y_pointer];
	}
	else if (y_pointer > 31 && y_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[y_pointer - 32];
	}
	else if (y_pointer > 95 && y_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[y_pointer - 96];
	}
	else if (y_pointer > 255)
	{
		// load from sram
		registers[d] = sram[y_pointer - 256];
	}
	
	PC++;
	
	cycles = cycles + 2;
	
} // end ld_y_4()

instruction_table[34] = function ld_z_1()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	
	if (z_pointer <= 31)
	{
		// load from register
		registers[d] = registers[z_pointer];
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[z_pointer - 32];
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[z_pointer - 96];
	}
	else if (z_pointer > 255)
	{
		// load from sram
		registers[d] = sram[z_pointer - 256];
	}
	
	PC++;
	
	cycles++;
	
} // end ld_z_1()

instruction_table[35] = function ld_z_2()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	
	if (z_pointer <= 31)
	{
		// load from register
		registers[d] = registers[z_pointer];
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[z_pointer - 32];
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[z_pointer - 96];
	}
	else if (z_pointer > 255)
	{
		// load from sram
		registers[d] = sram[z_pointer - 256];
	}
	
	z_pointer = (z_pointer + 1) & 65535;
	
	registers[31] = z_pointer >> 8 & 255;
	registers[30] = z_pointer & 255
	
	PC++;
	
	cycles = cycles + 2;
	
} // end ld_z_2()

instruction_table[36] = function ld_z_3()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	z_pointer = (z_pointer - 1) & 65535;
	
	if (z_pointer <= 31)
	{
		// load from register
		registers[d] = registers[z_pointer];
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[z_pointer - 32];
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[z_pointer - 96];
	}
	else if (z_pointer > 255)
	{
		// load from sram
		registers[d] = sram[z_pointer - 256];
	}
	
	
	
	registers[31] = z_pointer >> 8 & 255;
	registers[30] = z_pointer & 255
	
	PC++;
	
	cycles = cycles + 3;
	
} // end ld_z_3()

instruction_table[37] = function ld_z_4()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var q = (opcode >> 13 & 1) << 5 | (opcode >> 10 & 3) << 3 | (opcode & 7);
	
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	
	z_pointer = (z_pointer + q) & 65535;
	
	if (z_pointer <= 31)
	{
		// load from register
		registers[d] = registers[z_pointer];
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// load from io memory
		registers[d] = io_memory[z_pointer - 32];
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[z_pointer - 96];
	}
	else if (z_pointer > 255)
	{
		// load from sram
		registers[d] = sram[z_pointer - 256];
	}
	
	PC++;
	
	cycles = cycles + 2;
	
} // end ld_z_4()

instruction_table[38] = function ldi()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 15;
	var k = (opcode >> 8 & 15) << 4 | (opcode & 15);
	
	registers[d + 16] = k;
	
	PC++;
	cycles++;
	
} // end ldi()

instruction_table[39] = function lds()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var k = rom[PC + 1];
	
	if (k <= 31)
	{
		// load from register
		registers[d] = registers[k];
	}
	else if (k > 31 && k <= 95)
	{
		// load from io memory
		registers[d] = io_memory[k - 32];
	}
	else if (k > 95 && k <= 255)
	{
		// load from external io memory
		registers[d] = ext_io_memory[k - 96];
	}
	else if (k > 255)
	{
		// load from sram
		registers[d] = sram[k - 256];
	}
	
	PC = PC + 2;
	cycles = cycles + 2;
	
} // end lds()

instruction_table[40] = function lpm_1()
{
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	var byte_address = z_pointer >> 1;
	var lsb = z_pointer & 1;
	
	var temp = rom[byte_address];
	
	if (lsb == 0)
	{
		registers[0] = temp & 255;
	}
	else if (lsb == 1)
	{
		registers[0] = temp >> 8 & 255;
	}
	
	PC++;
	cycles = cycles + 3;
	
} // end lpm_1()

instruction_table[41] = function lpm_2()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	var byte_address = z_pointer >> 1;
	var lsb = z_pointer & 1;
	
	var temp = rom[byte_address];
	
	if (lsb == 0)
	{
		registers[d] = temp & 255;
	}
	else if (lsb == 1)
	{
		registers[d] = temp >> 8 & 255;
	}
	
	PC++;
	cycles = cycles + 3;
	
} // end lpm_2()

instruction_table[42] = function lpm_3()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	var byte_address = z_pointer >> 1;
	var lsb = z_pointer & 1;
	
	var temp = rom[byte_address];
	
	if (lsb == 0)
	{
		registers[d] = temp & 255;
	}
	else if (lsb == 1)
	{
		registers[d] = temp >> 8 & 255;
	}
	
	z_pointer = z_pointer + 1;
	registers[30] = z_pointer & 255;
	registers[31] = z_pointer >> 8 & 255;
	
	PC++;
	cycles = cycles + 3;
	
} // end lpm_3()

// LSL implemented as ADD Rd, Rd

instruction_table[43] = function lsr()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	
	var c_bit = registers[d] & 1;
	var z_bit = 0;
	
	// Logical shift right
	registers[d] = (registers[d] >> 1) & 255;
	
	if (registers[d] == 0)
	{
		z_bit = 1;
	}
	
	var n_bit = 0;
	var v_bit = (n_bit ^ c_bit) & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;

} // end lsr()

instruction_table[44] = function mov()
{
	var opcode = rom[PC];
	var r = (opcode >> 9 & 1) << 4 | (opcode & 15);
	var d = opcode >> 4 & 31;
	
	registers[d] = registers[r];
	
	PC++;
	cycles++;

} // end mov()

instruction_table[45] = function movw()
{
	var opcode = rom[PC];
	var r = opcode & 15;
	var d = opcode >> 4 & 15;
	
	registers[d*2] = registers[r*2];
	registers[d*2+1] = registers[r*2+1];
	
	PC++;
	cycles++;

} // end movw()

instruction_table[46] = function mul()
{

	var opcode = rom[PC];
	var r = (opcode >> 9 & 1) << 4 | (opcode & 15);
	var d = opcode >> 4 & 31;
	
	var temp = registers[r] * registers[d];

	
	registers[0] = temp & 255;
	registers[1] = temp >> 8 & 255;
	
	var c_bit = temp >> 15 & 1;
	var z_bit = 0;
	if (temp == 0)
	{
		z_bit = 1;
	}
	
	var n_bit = io_memory[63] >> 2 & 1;
	var v_bit = io_memory[63] >> 3 & 1;
	var s_bit = io_memory[63] >> 4 & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles = cycles + 2;
	
} // end mul()

instruction_table[47] = function muls()
{
	
	var opcode = rom[PC];
	var r = opcode & 15
	var d = opcode >> 4 & 15;
	
	// two's complement for signed integers
	var number_a = 0;
	var number_b = 0;
	if (registers[r+16] > 127)
	{
		// the number is negative
		number_a = -1 *(((~registers[r+16]) & 255) + 1);
	}
	else
	{
		// the number is positive
		number_a = registers[r+16];
	}
	
	
	if (registers[d+16] > 127)
	{
		// the number is negative
		number_b = -1 * (((~registers[d+16]) & 255) + 1);
	}
	else
	{
		// the number is positive
		number_b = registers[d+16];
	}
	
	
	var temp = number_a * number_b;
	var answer = 0;
	
	// Convert the answer into 16-bit signed integer
	if (temp < 0)
	{
		// number is negative
		answer = (~(temp * -1) & 65535) + 1;
	}
	else
	{
		// number is positive or zero
		answer = temp;
	}
		
	
	registers[0] = answer & 255;
	registers[1] = answer >> 8 & 255;
	
	var c_bit = answer >> 15 & 1;
	var z_bit = 0;
	if (answer == 0)
	{
		z_bit = 1;
	}
	
	var n_bit = io_memory[63] >> 2 & 1;
	var v_bit = io_memory[63] >> 3 & 1;
	var s_bit = io_memory[63] >> 4 & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles = cycles + 2;
	
} // end muls()

instruction_table[48] = function mulsu()
{
	var opcode = rom[PC];
	
	// r is unsigned
	var r = opcode & 7;
	
	// d is signed
	var d = opcode >> 4 & 7;
	
	// convert d to javascript compatible integer
	var multiplicand = 0;
	
	if (registers[d+16] > 127)
	{
		// the number is negative
		multiplicand = -1 * (((~registers[d+16]) & 255) + 1);
	}
	else
	{
		// the number is positive
		multiplicand = registers[d+16];
	}
	
	var temp = multiplicand * registers[r+16];
	var answer = 0;
	
	// Convert the answer into 16-bit signed integer
	if (temp < 0)
	{
		// number is negative
		answer = (~(temp * -1) & 65535) + 1;
	}
	else
	{
		// number is positive or zero
		answer = temp;
	}
		
	
	registers[0] = answer & 255;
	registers[1] = answer >> 8 & 255;
	
	var c_bit = answer >> 15 & 1;
	var z_bit = 0;
	if (answer == 0)
	{
		z_bit = 1;
	}
	
	var n_bit = io_memory[63] >> 2 & 1;
	var v_bit = io_memory[63] >> 3 & 1;
	var s_bit = io_memory[63] >> 4 & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles = cycles + 2;
	
	
} // end mulsu()

instruction_table[49] = function neg()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	
	var rd_3 = registers[d] >> 3 & 1;
	
	// replace with two's compliment
	registers[d] = (((~registers[d]) & 255) + 1) & 255;
	
	var h_bit = (registers[d] >> 3 & 1) | rd_3;
	var v_bit = 0;
	if (registers[d] == 128)
	{
		v_bit = 1;
	}

	var n_bit = registers[d] >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (registers[d] == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = 0;
	if (registers[d] != 0)
	{
		c_bit = 1;
	}
	
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
	
} // end neg()

instruction_table[50] = function nop()
{
	// do nothing
	cycles++;
	PC++;
	
} //end nop()

instruction_table[51] = function or()
{
	var opcode = rom[PC];
	var r = (opcode >> 9 & 1) << 4 | (opcode & 15);
	var d = opcode >> 4 & 31;
	
	registers[d] = registers[d] | registers[r];
	
	var v_bit = 0;
	var n_bit = registers[d] >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (registers[d] == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = io_memory[63] & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	cycles++;
	PC++;
	
} // end or()

instruction_table[52] = function ori()
{
	var opcode = rom[PC];
	var k = (opcode >> 8 & 15) << 4 | (opcode & 15);
	var d = opcode >> 4 & 15;
	
	registers[d+16] = registers[d+16] | k;
	
	var v_bit = 0;
	var n_bit = registers[d+16] >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (registers[d+16] == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = io_memory[63] & 1;
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	cycles++;
	PC++;
	
} // end ori()

instruction_table[53] = function out()
{
	var opcode = rom[PC];
	var a = (opcode >> 9 & 3) << 4 | (opcode & 15);
	var r = opcode >> 4 & 31;
	
	io_memory[a] = registers[r];
	
	cycles++;
	PC++;
	
} // end out()

instruction_table[54] = function pop()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	
	var stack_pointer = (io_memory[62] << 8 | io_memory[61]) - 256;
	stack_pointer = stack_pointer + 1;
	
	registers[d] = sram[stack_pointer];
	
	stack_pointer = stack_pointer + 256;
	io_memory[61] = stack_pointer & 255;
	io_memory[62] = (stack_pointer >> 8) & 255;
	
	cycles = cycles + 2;
	PC++;
	
} // end pop()

instruction_table[55] = function push()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var stack_pointer = (io_memory[62] << 8 | io_memory[61]) - 256;
	
	sram[stack_pointer] = registers[d];
	
	stack_pointer = stack_pointer - 1 + 256;
	
	io_memory[61] = stack_pointer & 255;
	io_memory[62] = (stack_pointer >> 8) & 255;
	
	cycles = cycles + 2;
	PC++;
	
} // end push()

instruction_table[56] = function r_call()
{
	var opcode = rom[PC];
	var k = opcode & 4095;
	
	var stack = PC + 1;
	var stack_pointer = (io_memory[62] << 8 | io_memory[61]) - 256;
	sram[stack_pointer] = stack >> 8 & 255;
	sram[stack_pointer - 1] = stack & 255;
	stack_pointer = stack_pointer - 2 + 256;
	io_memory[61] = stack_pointer & 255;
	io_memory[62] = (stack_pointer >> 8) & 255;
	
	// convert to javascript compatible integer
	var offset = 0;
	
	if (k > 2047)
	{
		// k is negative
		offset = -1 * (((~k) & 4095) + 1 & 4095);
	}
	else
	{
		// k is positive
		offset = k;
	}
	
	PC = PC + offset + 1;
	cycles = cycles + 3;
	
} // end r_call()

instruction_table[57] = function ret()
{
	var stack_pointer = (io_memory[62] << 8 | io_memory[61]) - 256;
	PC = sram[stack_pointer + 1] | (sram[stack_pointer + 2] << 8);
	// debug start
	//document.getElementById("return_label").value = PC;
	// debug end
	stack_pointer = stack_pointer + 2 + 256;
	io_memory[61] = stack_pointer & 255;
	io_memory[62] = (stack_pointer >> 8) & 255;
	
	cycles = cycles + 4;
	
} // end ret()

instruction_table[58] = function reti()
{
	var stack_pointer = (io_memory[62] << 8 | io_memory[61]) - 256;
	PC = sram[stack_pointer + 1] | (sram[stack_pointer + 2] << 8);
	stack_pointer = stack_pointer + 2 + 256;
	io_memory[61] = stack_pointer & 255;
	io_memory[62] = (stack_pointer >> 8) & 255;
	
	// enable 'i' flag
	io_memory[63] = io_memory[63] | 128;
	
	cycles = cycles + 4;
	
} // end reti()

instruction_table[59] = function rjmp()
{
	var opcode = rom[PC];
	var k = opcode & 4095;
	
	// convert to javascript compatible integer
	var offset = 0;
	
	if (k > 2047)
	{
		// k is negative
		offset = -1 * (((~k) & 4095) + 1 & 4095);
	}
	else
	{
		// k is positive
		offset = k;
	}	
	
	PC = PC + offset + 1;
	cycles = cycles + 2;
	
} // end rjmp()

// ROL implemented as ADC Rd, Rd

instruction_table[60] = function ror()
{

	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	
	var c_before_bit = registers[d] & 1;
	registers[d] = registers[d] >> 1;
	var c_after_bit = io_memory[63] & 1;
	var temp = registers[d] & 127;
	registers[d] = temp | c_after_bit << 7;
	
	var n_bit = registers[d] >> 7 & 1;
	var z_bit = 0;
	if (registers[d] == 0)
	{
		z_bit = 1;
	}

	var c_bit  = c_before_bit;
	
	//v_bit = (n_bit ^ c_bit) & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	// Try moving v_bit calculation
	var v_bit = (n_bit ^ c_bit) & 1;
	
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	cycles++;
	PC++;
	
} // end ror()

instruction_table[61] = function sbc()
{
	var opcode = rom[PC];
	var r = (opcode >> 9 & 1) << 4 | (opcode & 15);
	var d = opcode >> 4 & 31;
	var c = io_memory[63] & 1;
	
	var temp = (registers[d] - registers[r] - c) & 255;
	
	var h_bit = (~(registers[d] >> 3 & 1) & 1) & (registers[r] >> 3 & 1) | (registers[r] >> 3 & 1) & (temp >> 3 & 1) | (temp >> 3 & 1) & (~(registers[d] >> 3 & 1 )& 1);
	var v_bit = (registers[d] >> 7 & 1) & (~(registers[r] >> 7 & 1) & 1) & (~(temp >> 7 & 1) & 1) | (~(registers[d] >> 7 & 1) & 1) & (registers[r] >> 7 & 1) & (temp >> 7 & 1);
	var n_bit = temp >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (temp == 0)
	{
		z_bit = io_memory[63] >> 1 & 1;
	}
	
	var c_bit = (~(registers[d] >> 7 & 1) & 1) & (registers[r] >> 7 & 1) | (registers[r] >> 7 & 1) & (temp >> 7 & 1) | (temp >> 7 & 1) & (~(registers[d] >> 7 & 1) & 1);
	
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	registers[d] = temp;
	
	cycles++;
	PC++;
	
} // end sbc()

instruction_table[62] = function sbci()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 15;
	var k = (opcode >> 8 & 15) << 4 | (opcode & 15);
	var c = io_memory[63] & 1;
	
	var temp = (registers[d+16] - k - c) & 255;
	
	var h_bit = (~(registers[d+16] >> 3 & 1) & 1) & (k >> 3 & 1) | (k >> 3 & 1) & (temp >> 3 & 1) | (temp >> 3 & 1) & (~(registers[d+16] >> 3 & 1) & 1);
	var v_bit = (registers[d+16] >> 7 & 1) & (~(k >> 7 & 1) & 1) & (~(temp >> 7 & 1) & 1) | (~(registers[d+16] >> 7 & 1) & 1) & (k >> 7 & 1) & (temp >> 7 & 1);
	var n_bit = temp >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (temp == 0)
	{
		z_bit = (io_memory[63] >> 1) & 1;
	}
	else
	{
		z_bit = 0;
	}
	
	var c_bit = (~(registers[d+16] >> 7 & 1) & 1) & (k >> 7 & 1) | (k >> 7 & 1) & (temp >> 7 & 1) | (temp >> 7 & 1) & (~(registers[d+16] >> 7 & 1) & 1);
	
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	registers[d+16] = temp;
	
	cycles++;
	PC++;
	
}// end sbci()

instruction_table[63] = function sbi()
{
	var opcode = rom[PC];
	var a = opcode >> 3 & 31;
	var b = opcode & 7;
	
	var mask = 1 << b;
	
	io_memory[a] = io_memory[a] | mask;
	
	cycles = cycles + 2;
	PC++;
	
} // end sbi()

instruction_table[64] = function sbic()
{
	var opcode = rom[PC];
	var a = opcode >> 3 & 31;
	var b = opcode & 7;
	var bit_value = io_memory[a] >> b & 1;
	
	if (bit_value == 0)
	{
		if (get_words(rom[PC + 1]) == 2)
		{
			PC = PC + 3;
			cycles = cycles + 3;
		}
		else
		{
			PC = PC + 2;
			cycles = cycles + 2;
		}
	}
	
	else
	{
		PC++;
		cycles++;
	}
	
} // end sbic()

instruction_table[65] = function sbis()
{
	var opcode = rom[PC];
	var a = opcode >> 3 & 31;
	var b = opcode & 7;
	var bit_value = io_memory[a] >> b & 1;
	
	if (bit_value == 1)
	{
		if (get_words(rom[PC + 1]) == 2)
		{
			PC = PC + 3;
			cycles = cycles + 3;
		}
		else
		{
			PC = PC + 2;
			cycles = cycles + 2;
		}
	}
	
	else
	{
		PC++;
		cycles++;
	}
	
} // end sbis()

instruction_table[66] = function sbiw()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 3;
	var k = (opcode >> 6 & 3) << 4 | (opcode & 15);
	
	d = d*2 + 24;
	
	var register_word = registers[d + 1] << 8 | registers[d];
	
	var temp = (register_word - k) & 65535;
	
	var v_bit = (registers[d+1] >> 7 & 1) & (~(temp >> 15 & 1) & 1);
	var n_bit = temp >> 15 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (temp == 0)
	{
		z_bit = 1;
	}
	var c_bit = (temp >> 15 & 1) & (~(registers[d + 1] >> 7 & 1) & 1);
	
	var h_bit = io_memory[63] >> 5 & 1;
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	registers[d] = temp & 255;
	registers[d + 1] = temp >> 8 & 255;
	
	PC++;
	cycles = cycles + 2;
	
} // end sbiw()

// SBR implemented as ORI

instruction_table[67] = function sbrc()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var b = opcode & 7;
	var bit_value = (registers[r] >> b) & 1;
	
	if (bit_value == 0)
	{
		if (get_words(rom[PC + 1]) == 2)
		{
			PC = PC + 3;
			cycles = cycles + 3;
		}
		else
		{
			PC = PC + 2;
			cycles = cycles + 2;
		}
	}
	
	else
	{
		PC++;
		cycles++;
	}
	
} // end sbrc()

instruction_table[68] = function sbrs()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var b = opcode & 7;
	var bit_value = (registers[r] >> b) & 1;
	
	if (bit_value == 1)
	{
		if (get_words(rom[PC + 1]) == 2)
		{
			PC = PC + 3;
			cycles = cycles + 3;
		}
		else
		{
			PC = PC + 2;
			cycles = cycles + 2;
		}
	}
	
	else
	{
		PC++;
		cycles++;
	}
	
} // end sbrs()

instruction_table[69] = function sleep()
{
	// not implemented
	cycles++;
	PC++;
	
} // end sleep()

// SPM instructions are not allowed in Application programs

instruction_table[70] = function st_x_1()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var x_pointer = registers[27] << 8 | registers[26] & 255;
	
	if (x_pointer <= 31)
	{
		// store to register
		registers[x_pointer] = registers[r];	
	}
	else if (x_pointer > 31 && x_pointer <= 95)
	{
		// store to io memory
		io_memory[x_pointer - 32] = registers[r];
	}
	else if (x_pointer > 95 && x_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[x_pointer - 96] = registers[r];
	}
	else if (x_pointer > 255)
	{
		// store to sram
		sram[x_pointer - 256] = registers[r];
	}
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_x_1()

instruction_table[71] = function st_x_2()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var x_pointer = registers[27] << 8 | registers[26] & 255;
	
	if (x_pointer <= 31)
	{
		// store to register
		registers[x_pointer] = registers[r];	
	}
	else if (x_pointer > 31 && x_pointer <= 95)
	{
		// store to io memory
		io_memory[x_pointer - 32] = registers[r];
	}
	else if (x_pointer > 95 && x_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[x_pointer - 96] = registers[r];
	}
	else if (x_pointer > 255)
	{
		// store to sram
		sram[x_pointer - 256] = registers[r];
	}
	
	x_pointer = x_pointer + 1;
	registers[26] = x_pointer & 255;
	registers[27] = x_pointer >> 8 & 255;
	
	PC++;
	
	cycles = cycles + 2;
	
}// end st_x_2()

instruction_table[72] = function st_x_3()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var x_pointer = registers[27] << 8 | registers[26] & 255;
	x_pointer = x_pointer - 1;
	
	if (x_pointer <= 31)
	{
		// store to register
		registers[x_pointer] = registers[r];	
	}
	else if (x_pointer > 31 && x_pointer <= 95)
	{
		// store to io memory
		io_memory[x_pointer - 32] = registers[r];
	}
	else if (x_pointer > 95 && x_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[x_pointer - 96] = registers[r];
	}
	else if (x_pointer > 255)
	{
		// store to sram
		sram[x_pointer - 256] = registers[r];
	}
	
	registers[26] = x_pointer & 255;
	registers[27] = x_pointer >> 8 & 255;
	
	PC++;
	
	cycles = cycles + 2;
	
}// end st_x_3()

instruction_table[73] = function st_y_1()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var y_pointer = registers[29] << 8 | registers[28] & 255;
	
	if (y_pointer <= 31)
	{
		// store to register
		registers[y_pointer] = registers[r];	
	}
	else if (y_pointer > 31 && y_pointer <= 95)
	{
		// store to io memory
		io_memory[y_pointer - 32] = registers[r];
	}
	else if (y_pointer > 95 && y_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[y_pointer - 96] = registers[r];
	}
	else if (y_pointer > 255)
	{
		// store to sram
		sram[y_pointer - 256] = registers[r];
	}
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_y_1()

instruction_table[74] = function st_y_2()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var y_pointer = registers[29] << 8 | registers[28] & 255;
	
	if (y_pointer <= 31)
	{
		// store to register
		registers[y_pointer] = registers[r];	
	}
	else if (y_pointer > 31 && y_pointer <= 95)
	{
		// store to io memory
		io_memory[y_pointer - 32] = registers[r];
	}
	else if (y_pointer > 95 && y_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[y_pointer - 96] = registers[r];
	}
	else if (y_pointer > 255)
	{
		// store to sram
		sram[y_pointer - 256] = registers[r];
	}
	
	y_pointer = y_pointer + 1;
	registers[28] = y_pointer & 255;
	registers[29] = y_pointer >> 8 & 255;
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_y_2()

instruction_table[75] = function st_y_3()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var y_pointer = registers[29] << 8 | registers[28] & 255;
	y_pointer = y_pointer - 1;
	
	if (y_pointer <= 31)
	{
		// store to register
		registers[y_pointer] = registers[r];	
	}
	else if (y_pointer > 31 && y_pointer <= 95)
	{
		// store to io memory
		io_memory[y_pointer - 32] = registers[r];
	}
	else if (y_pointer > 95 && y_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[y_pointer - 96] = registers[r];
	}
	else if (y_pointer > 255)
	{
		// store to sram
		sram[y_pointer - 256] = registers[r];
	}
	
	registers[28] = y_pointer & 255;
	registers[29] = y_pointer >> 8 & 255;
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_y_3()

instruction_table[76] = function st_y_4()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var q = (opcode >> 13 & 1) << 5 | (opcode >> 10 & 3) << 3 | (opcode & 7);
	
	var y_pointer = registers[29] << 8 | registers[28] & 255;
	
	y_pointer = (y_pointer + q) & 65535;
	
	if (y_pointer <= 31)
	{
		// store to register
		registers[y_pointer] = registers[r];	
	}
	else if (y_pointer > 31 && y_pointer <= 95)
	{
		// store to io memory
		io_memory[y_pointer - 32] = registers[r];
	}
	else if (y_pointer > 95 && y_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[y_pointer - 96] = registers[r];
	}
	else if (y_pointer > 255)
	{
		// store to sram
		sram[y_pointer - 256] = registers[r];
	}
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_y_4()

instruction_table[77] = function st_z_1()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	
	if (z_pointer <= 31)
	{
		// store to register
		registers[z_pointer] = registers[r];	
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// store to io memory
		io_memory[z_pointer - 32] = registers[r];
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[z_pointer - 96] = registers[r];
	}
	else if (z_pointer > 255)
	{
		// store to sram
		sram[z_pointer - 256] = registers[r];
	}
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_z_1()

instruction_table[78] = function st_z_2()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	
	if (z_pointer <= 31)
	{
		// store to register
		registers[z_pointer] = registers[r];	
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// store to io memory
		io_memory[z_pointer - 32] = registers[r];
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[z_pointer - 96] = registers[r];
	}
	else if (z_pointer > 255)
	{
		// store to sram
		sram[z_pointer - 256] = registers[r];
	}
	
	z_pointer = z_pointer + 1;
	registers[30] = z_pointer & 255;
	registers[31] = z_pointer >> 8 & 255;
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_z_2()

instruction_table[79] = function st_z_3()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	var z_pointer = z_pointer - 1;
	
	if (z_pointer <= 31)
	{
		// store to register
		registers[z_pointer] = registers[r];	
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// store to io memory
		io_memory[z_pointer - 32] = registers[r];
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[z_pointer - 96] = registers[r];
	}
	else if (z_pointer > 255)
	{
		// store to sram
		sram[z_pointer - 256] = registers[r];
	}
	
	registers[30] = z_pointer & 255;
	registers[31] = z_pointer >> 8 & 255;
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_z_3()

instruction_table[80] = function st_z_4()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var q = (opcode >> 13 & 1) << 5 | (opcode >> 10 & 3) << 3 | (opcode & 7);
	
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	
	z_pointer = (z_pointer + q) & 65535;
	
	if (z_pointer <= 31)
	{
		// store to register
		registers[z_pointer] = registers[r];	
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// store to io memory
		io_memory[z_pointer - 32] = registers[r];
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// store to external io memory
		ext_io_memory[z_pointer - 96] = registers[r];
	}
	else if (z_pointer > 255)
	{
		// store to sram
		sram[z_pointer - 256] = registers[r];
	}
	
	PC++;
	
	cycles = cycles + 2;
	
} // end st_z_4()

instruction_table[81] = function sts()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var k = rom[PC + 1];
	
	if (k <= 31)
	{
		// store to register
		registers[k] = registers[d];	
	}
	else if (k > 31 && k <= 95)
	{
		// store to io memory
		io_memory[k - 32] = registers[d];
	}
	else if (k > 95 && k <= 255)
	{
		// store to external io memory
		ext_io_memory[k - 96] = registers[d];
	}
	else if (k > 255)
	{
		// store to sram
		sram[k - 256] = registers[d];
	}
	
	cycles = cycles + 2;
	PC = PC + 2;
	
} // end sts()

// STS (16 bit) not avaliable

instruction_table[82] = function sub()
{
	var opcode = rom[PC];
	var r = (opcode >> 9 & 1) << 4 | (opcode & 15);
	var d = opcode >> 4 & 31;
	
	var temp = (registers[d] - registers[r]) & 255;
	
	var h_bit = (~(registers[d] >> 3 & 1) & 1) & (registers[r] >> 3 & 1) | (registers[r] >> 3 & 1) & (temp >> 3 & 1) | (temp >> 3 & 1) & (~(registers[d] >> 3 & 1) & 1);
	var v_bit = (registers[d] >> 7 & 1) & (~(registers[r] >> 7 & 1) & 1) & (~(temp >> 7 & 1) & 1) | (~(registers[d] >> 7 &  1) & 1) & (registers[r] >> 7 & 1) & (temp >> 7 & 1);
	var n_bit = temp >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (temp == 0)
	{
		z_bit = 1;
	}

	var c_bit = (~(registers[d] >> 7 & 1) & 1) & (registers[r] >> 7 & 1) | (registers[r] >> 7 & 1) & (temp >> 7 & 1) | (temp >> 7 & 1) & (~(registers[d] >> 7 & 1) & 1);
	
	registers[d] = temp;
	
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	PC++;
	cycles++;
	
} // end sub()

instruction_table[83] = function subi()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 15;
	var k = (opcode >> 8 & 15) << 4 | (opcode & 15);
	
	var temp = (registers[d+16] - k) & 255;
	
	var h_bit = (~(registers[d+16] >> 3 & 1) & 1) & (k >> 3 & 1) | (k >> 3 & 1) & (temp >> 3 & 1) | (temp >> 3 & 1) & (~(registers[d+16] >> 3 & 1) & 1);
	var v_bit = (registers[d+16] >> 7 & 1) & (~(k >> 7 & 1) & 1) & (~(temp >> 7 & 1) & 1) | (~(registers[d+16] >> 7 & 1) & 1) & (k >> 7 & 1) & (temp >> 7 & 1);
	var n_bit = temp >> 7 & 1;
	var s_bit = (n_bit ^ v_bit) & 1;
	var z_bit = 0;
	if (temp == 0)
	{
		z_bit = 1;
	}
	
	var c_bit = (~(registers[d+16] >> 7 & 1) & 1) & (k >> 7 & 1) | (k >> 7 & 1) & (temp >> 7 & 1) | (temp >> 7 & 1) & (~(registers[d+16] >> 7 & 1) & 1);
	
	registers[d + 16] = temp;
	
	var t_bit = io_memory[63] >> 6 & 1;
	var i_bit = io_memory[63] >> 7 & 1;
	
	io_memory[63] = c_bit | z_bit << 1 | n_bit << 2 | v_bit << 3 | s_bit << 4 | h_bit << 5 | t_bit << 6 | i_bit << 7;
	
	cycles++;
	PC++;
	
} // end subi()

instruction_table[84] = function swap()
{
	var opcode = rom[PC];
	var d = opcode >> 4 & 31;
	var low_nibble = registers[d] & 15;
	var high_nibble = registers[d] >> 4 & 15;
	registers[d] = (low_nibble << 4) | high_nibble;
	
	cycles++;
	PC++;
	
} // end swap()

// TST implemented as AND Rd, Rd

instruction_table[85] = function wdr()
{
	// Not implemented yet!
	cycles++;
	PC++;
	
} // end wdr()

instruction_table[86] = function xch()
{
	var opcode = rom[PC];
	var r = opcode >> 4 & 31;
	var r_data = registers[r];
	
	var z_pointer = registers[31] << 8 | registers[30] & 255;
	var z_data = 0;
	
	// Exchange
	if (z_pointer <= 31)
	{
		// exchange with register
		z_data = registers[z_pointer];
		registers[z_pointer] = r_data;
		registers[r] = z_data;	
	}
	else if (z_pointer > 31 && z_pointer <= 95)
	{
		// exchange with io memory
		z_data = io_memory[z_pointer - 32];
		io_memory[z_pointer - 32] = r_data;
		registers[r] = z_data;
	}
	else if (z_pointer > 95 && z_pointer <= 255)
	{
		// exchange with external io memory
		z_data = ext_io_memory[z_pointer - 96];
		ext_io_memory[z_pointer - 96] = r_data;
		registers[r] = z_data;
	}
	else if (z_pointer > 255)
	{
		// exchange with sram
		z_data = sram[z_pointer - 256];
		sram[z_pointer - 256] = r_data;
		registers[r] = z_data;
	}
	
	cycles++;
	PC++;
	
} // end xch()


// ------------------- END of instruction set ------------------------------
	
	
function run_eeprom()
{
	// http://www.scienceprog.com/atmega-eeprom-memory-writing/
	var eearl = io_memory[33];
	var eearh = io_memory[34];
	var eeprom_address = (eearh << 8) | eearl;
	
	var eedr = io_memory[32];
	
	eeprom_ticks = eeprom_ticks + cycles;
	
	if (eeprom_ticks > 4)
	{
		eeprom_ticks = 0;
		var eepme_bit = 0;
		var eecr_1 = io_memory[31] >> 3 & 31;
		var eecr_2 = io_memory[31] & 3;
		io_memory[31] = (eecr_1 << 3) | (eepme_bit << 2) | eecr_2;
	}		
		
	
	var eecr = io_memory[31];
	var eempe_bit = eecr >> 2 & 1;
	var eepe_bit = eecr >> 1 & 1;
				
		
	
	if ((eempe_bit == 1) && (eepe_bit == 1))
	{
		// write EEPROM
		eeprom[eeprom_address] = eedr;
	}
	
	var eere_bit = eecr & 1;
	
	if ((eere_bit == 1) && (eempe_bit == 0))
	{
		// read EEPROM
		io_memory[32] = eeprom[eeprom_address];
	}
	
} // end run_eeprom()

function run_timers()
{
	/* Only inverted fast pwm mode on timer 1 is
	 * used for video generation therefore we will only
	 * emulate this one, for now.
	 */
	 
		
	
	// -----------------  timer 1 ---------------------------
	var tcnt1 = (ext_io_memory[37] << 8 & 255) | (ext_io_memory[36] & 255);
	var icr1 = (ext_io_memory[39] << 8 & 255) | (ext_io_memory[38] & 255);
	var ocr1a = (ext_io_memory[41] << 8 & 255) | (ext_io_memory[40] & 255);
	var ocr1b = (ext_io_memory[43] << 8 & 255) | (ext_io_memory[42] & 255);
	var tccr1a = ext_io_memory[32];
	
	// tccr1a bits
	var com1a1 = tccr1a >> 7 & 1;
	var com1a0 = tccr1a >> 6 & 1;
	var com1b1 = tccr1a >> 5 & 1;
	var com1b0 = tccr1a >> 4 & 1;
	var wgm11 = tccr1a >> 1 & 1;
	var wgm10 = tccr1a & 1;	
	
	var tccr1b = ext_io_memory[33];
	
	// tccr1b bits
	var icnc1 = tccr1b >> 7 & 1;
	var ices1 = tccr1b >> 6 & 1;
	var wgm13 = tccr1b >> 4 & 1;
	var wgm12 = tccr1b >> 3 & 1;
	var cs12 = tccr1b >> 2 & 1;
	var cs11 = tccr1b >> 1 & 1;
	var cs10 = tccr1b & 1;
	
	var tccr1c = ext_io_memory[34];

	
	var prescale_1 = 0;
	
	if ((cs12 == 0) && (cs11 == 0) && (cs10 == 0))
	{
		// Timer is stopped
		prescale_1 = 0;
	}
	
	else if ((cs12 == 0) && (cs11 == 0) && (cs10 == 1))
	{
		// NO prescaling
		prescale_1 = 1;
	}
	
	else if ((cs12 == 0) && (cs11 == 1) && (cs10 == 0))
	{
		// Clock frequency is divided by 8
		prescale_1 = (1/8);
	}
	
	else if ((cs12 == 0) && (cs11 == 1) && (cs10 == 1))
	{
		// Clock frequency is divided by 64
		prescale_1 = (1/64);
	}
	
	else if ((cs12 == 1) && (cs11 == 0) && (cs10 == 0))
	{
		// Clock frequency is divided by 256
		prescale_1 = (1/256);
	}
	
	else if ((cs12 == 1) && (cs11 == 0) && (cs10 == 1))
	{
		// Clock frequency is divided by 1024
		prescale_1 = (1/1024);
	}
	
	// ((wgm13 == 1) && (wgm12 == 1) && (wgm11 == 1) && (wgm10 == 0))
	if ((wgm13 == 1) && (wgm12 == 1) && (wgm11 == 1) && (wgm10 == 0))
	{
		//alert("timer 1 working");
		// fast PWM
		// Just for testing
		//prescale_1 = 1;
		
		var timer_1_top = icr1;
		timer_1_value = timer_1_value + (cycles * prescale_1);
		var _count = Math.floor(timer_1_value);
		//alert(_count);
		ext_io_memory[37] = _count >> 8 & 255;
		ext_io_memory[36] = _count & 255;
		// Set OC1A (sync pin) on compare match
		if (_count >=  ocr1a)
		{
			io_memory[5] = io_memory[5] | 2;
		}
		
		if (_count > timer_1_top)
		{
			_count = 0;
			timer_1_value = 0;
			ext_io_memory[37] = 0;
			ext_io_memory[36] = 0;
			// Set TOV1 IRQ
			io_memory[22] = io_memory[22] | 1;
			// We are now at BOTTOM therefore OC1A (sync pin) needs to be updated, cleared.
			io_memory[5] = io_memory[5] & 253;
			//A line has effectively been drawn on the "TV"
			rx_hsync();
			
		}
	}

	
} // end run_timers()

function run_irqs()
{
	/* Only timer 1 overflow IRQ is used for video generation so we'll
	 * only emulate that one, for now.
	 */
	 
	 var i_bit = io_memory[63] >> 7 & 1;
	 var toie1 = ext_io_memory[15] & 1;
	 var tov1 = io_memory[22] & 1;
	 var tov1_backup = io_memory[22];
	 
	 // Run timer 1 overflow IRQ if needed
	 if ((i_bit == 1) && (toie1 == 1) && (tov1 == 1))
	 {
		 // Push program counter onto stack
		var stack = PC;
		var stack_pointer = (io_memory[62] << 8 | io_memory[61]) - 256;
		sram[stack_pointer] = stack >> 8 & 255;
		sram[stack_pointer-1] = stack & 255;
		stack_pointer = stack_pointer - 2 + 256;
		io_memory[61] = stack_pointer & 255;
		io_memory[62] = (stack_pointer >> 8) & 255;
		 
		 // Debugging
		 //pause_hackvision();
		 //alert("Calling Line Render");
		 
		 // This is the TIMER 1 OVF vector
		 PC = 26;
		 // Clear the TOV1 bit
		 io_memory[22] = (tov1_backup & 254);
		 // Clear the I bit in the SREG
		 io_memory[63] = io_memory[63] & 127;
	 }
	 
} // end run_irqs()

function clear_cycles()
{
	cycles = 0;
	
} // end clear_cycles()

function debug_stack_pointer()
{
	if ((io_memory[61] | io_memory[62] << 8) > 2303)
	{
		pause_hackvision();
		alert("Stack Pointer Overflow!");
	}
	// check top of stack
	//_stack_pointer = io_memory[61] | (io_memory[62] << 8);
	//if ((sram[_stack_pointer - 256 + 1]) | (sram[_stack_pointer - 256 + 2] << 8) == 43527)
	//{
	//	if (!debug_called)
	//	{
	//		pause_hackvision();
	//		alert("BREAK POINT");
	//		debug_called = true;
	//	}
	//}
	//else
	//{
	//	debug_called = false;
	//}
	
} // end debug_stack_pointer()

function stack_dump()
{
	// display call stack
	var stack_log_object = document.getElementById("stack_log");
	stack_log_object.value = "";
	var stack_ptr = (io_memory[61] | io_memory[62] << 8) - 256;
	for (var i = stack_ptr; i < 2048; i++)
	{
		stack_log_object.value = stack_log_object.value + sram[i] + "\n";
	}
}

function debug_jump()
{
	var jump_object = document.getElementById("jmp_address_label");
	var jump_addr = jump_object.value;
	PC = Math.floor(jump_addr);
}
