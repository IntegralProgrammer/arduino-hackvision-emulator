//This file handles loading an Intel HEX file into ROM. It also handles debugging the ROM by dumping a section of it to a console.

function check_instruction(opcode)
{

	if ((opcode >> 10 & 63) == 3)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 7)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 150)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 8)
	{
		return 0;
	}
	
	else if ((opcode >> 12 & 4095) == 7)
	{
		return 0;
	}
	
	else if ((opcode & 15) == 5 && (opcode >> 9 & 127) == 74)
	{
		return 0;
	}
	
	else if ((opcode & 15) == 8 && (opcode >>7 & 511) == 297)
	{
		return 0;
	}
	
	else if((opcode >> 3 & 1) == 0 && (opcode >> 9 & 127) == 124)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 61 && (opcode & 7) != 0)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 60 && (opcode & 7) != 0)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 61 && (opcode & 7) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 60 && (opcode & 7) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 7 & 511) == 296 && (opcode & 15) == 8)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 125 && (opcode >> 3 & 1) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode >> 1 & 7) == 7)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 152)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 5)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 1)
	{
		return 0;
	}
	
	else if ((opcode >> 12 & 15) == 3)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 4)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 10)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 148 && (opcode & 15) == 11)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 9)
	{
		return 0;
	}
	
	else if (opcode == 38153)
	{
		return 0;
	}
	
	else if (opcode == 37897)
	{
		return 0;
	}
	
	else if ((opcode >> 11 & 31) == 22)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 3)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode >> 1 & 7) == 6)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 12)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 13)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 10)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 64 && (opcode & 15) == 8)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 9)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 10)
	{
		return 0;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 0 && (opcode >> 3 & 1) == 1)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 64 && (opcode & 15) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 1)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 2)
	{
		return 0;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 0 && (opcode >> 3 & 1) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 12 & 15) == 14)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 0)
	{
		return 0;
	}
	
	else if (opcode == 38344)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 4)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 5)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 6)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 11)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 1)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 39)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 2)
	{
		return 0;
	}
	
	else if ((opcode >> 7 & 511) == 6)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 1)
	{
		return 0;
	}
	
	else if (opcode == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 10)
	{
		return 0;
	}
	
	else if ((opcode >> 12 & 15) == 6)
	{
		return 0;
	}
	
	else if ((opcode >> 11 & 31) == 23)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 72 && (opcode & 15) == 15)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 15)
	{
		return 0;
	}
	
	else if ((opcode >> 12 & 15) == 13)
	{
		return 0;
	}
	
	else if (opcode == 38152)
	{
		return 0;
	}
	
	else if (opcode == 38168)
	{
		return 0;
	}
	
	else if ((opcode >> 12 & 15) == 12)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 7)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 2)
	{
		return 0;
	}
	
	else if ((opcode >> 12 & 15) == 4)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 154)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 153)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 155)
	{
		return 0;
	}
	
	else if ((opcode >> 8 & 255) == 151)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 126 && (opcode >> 3 & 1) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 127 && (opcode >> 3 & 1) == 0)
	{
		return 0;
	}
	
	else if (opcode == 38280)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 12)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 13)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 14)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 65 && (opcode & 15) == 8)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 9)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 10)
	{
		return 0;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 1 && (opcode >> 3 & 1) == 1)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 65 && (opcode & 15) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 1)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 2)
	{
		return 0;
	}
	
	else if ((opcode >> 14 & 3) == 2 && (opcode >> 12 & 1) == 0 && (opcode >> 9 & 1) == 1 && (opcode >> 3 & 1) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 73 && (opcode & 15) == 0)
	{
		return 0;
	}
	
	else if ((opcode >> 10 & 63) == 6)
	{
		return 0;
	}
	
	else if ((opcode >> 12 & 15) == 5)
	{
		return 0;
	}
	
	else if ((opcode >> 9 & 127) == 74 && (opcode & 15) == 2)
	{
		return 0;
	}
	
	else if (opcode == 38312)
	{
		return 0;
	}
	
	else if ((opcode >> 4 & 31) == 73 && (opcode & 15) == 4)
	{
		return 0;
	}
	
	else
	{
		return 1;
	}

	
} // end check_instruction()

// http://stackoverflow.com/questions/5320439/how-do-i-swap-endian-ness-byte-order-of-a-variable-in-javascript
function swap16(val)
{
	return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
}


// http://arduino.cc/forum/index.php?topic=59476.0
function load_hex()
{
	var txt_box = document.getElementById("hex_txt");
	var hex_data = txt_box.value;
	var hex_data_array = hex_data.split(":");
	var index = 1;
	var line = hex_data_array[index];
	var address_offset = 0;
	var alerted = false;
	var sp_modify = 0;
	var timer_modify_count = 0;
	var timer_modify_address = 0;
	var address_number = 0;
	var word_count = 0;
	var address_txt = "";
	var record_type = 0;
	var sixteen_bytes_txt = "";
	var word_txt = "";
	var word_number = 0;
	while (line != null)
	{
		// Process the current line and load in into ROM
		address_txt = line.substring(2,6);
		// This is a byte address, not a word address, divide by 2 to get word address
		address_number = parseInt(address_txt, 16) / 2;
		// Get record type
		record_type = line.substring(6,8);
		// Check record type, if EOF record, we are finished
		if (parseInt(record_type, 16) == 01)
		{
			//alert(rom[0]);
			//alert("Found EOF record, breaking");
			//alert(rom[0]);
			break;
		}
		
		// Each line contains 16 bytes of data
		sixteen_bytes_txt = line.substring(8,41);
		// Load these bytes into ROM, 1 word = 2 bytes
		address_offset = 0;
		for (var i = 0; i < 32; i += 4)
		{
			word_txt = sixteen_bytes_txt.substring(i, i+4);
			word_number = parseInt(word_txt, 16);
			// Before byte-swapping load word into raw_rom
			raw_rom[address_number + address_offset] = word_number;
			
			// The bytes of the instruction are reversed
			word_number = swap16(word_number);
			//if (check_instruction(word_number) == 1)
			//{
				//alert("Unknown instruction " + word_number + " found at " + (address_number + address_offset));
			//}
			if (word_number == 0xbfcd)
			{
				sp_modify = sp_modify + 1;
			}
			if (word_number == 0xec82)
			{
				timer_modify_count = timer_modify_count + 1;
				timer_modify_address = address_number + address_offset;
			}
			
			// Load the word, also decode it
			rom[address_number  + address_offset] = word_number;
			decoded_rom[address_number + address_offset] = decode_instruction(word_number);
			instruction_name_table[address_number + address_offset] = decode_instruction_name(word_number);
			
			word_count = word_count + 1;
			address_offset = address_offset + 1;
		} // end for i
		index = index + 1;
		//address_number = address_number + 8;
		line = hex_data_array[index];
		
	}// end while line

	document.getElementById("word_count_label").value = word_count;
	alert("Done Loading HEX file");
	
	// Display the instruction about to be run
	update_debugger();	
}// end load_hex()

function rom_dump()
{
	var dumping_console = document.getElementById("rom_log");
	var rom_dump_start = document.getElementById("rom_dump_start").value;
	var rom_dump_end = document.getElementById("rom_dump_end").value;
	dumping_console.value = "";
	for (var i = rom_dump_start; i< rom_dump_end; i++)
	{
		dumping_console.value = dumping_console.value + rom[i] + "\n";
	}
}// end rom_dump()
	