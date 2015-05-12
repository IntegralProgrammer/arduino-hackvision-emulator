//This file handles graphical output for the emulated hackvision


var tv_x = 0;
var tv_y = 0;
var television_data = "";
var television_screen = "";
var television_object = "";
var big_screen_object = "";
var big_screen_ctx = "";
var sync_ticks = 0;
var tv_cycles = 0;
var permanent_fb_addr = 0;
var tv_line_count = 0;
var tv_x_resolution = 0;
var tv_y_resolution = 0;

function set_permanent_fb_addr()
{
	var txt_const_fb_addr = document.getElementById("const_fb_addr");
	permanent_fb_addr = txt_const_fb_addr.value;
}

function tv_init()
{
	tv_x_resolution = document.getElementById("const_xres").value;
	tv_y_resolution = document.getElementById("const_yres").value;
	//Adjust canvas sizes
	var small_screen_ref = document.getElementById("tv_canvas");
	var big_screen_ref = document.getElementById("big_screen");
	small_screen_ref.width = tv_x_resolution;
	small_screen_ref.height = tv_y_resolution;
	big_screen_ref.width = 4 * tv_x_resolution;
	big_screen_ref.height = 4 * tv_y_resolution;
	tv_x = 0;
	tv_y = 0;
	television_object = document.getElementById("tv_canvas");
	television_screen = television_object.getContext("2d");
	television_screen.fillStyle="#000000";
	television_screen.fillRect(0,0,tv_x_resolution,tv_y_resolution);
	television_data = television_screen.getImageData(0,0,tv_x_resolution,tv_y_resolution);
	big_screen_object = document.getElementById("big_screen");
	big_screen_ctx = big_screen_object.getContext("2d");
	big_screen_ctx.drawImage(television_object,0,0,4 * tv_x_resolution, 4 * tv_y_resolution);
	sync_ticks = 0;
	tv_cycles = 0;
}

function tv_advance_pixel()
{
	// Read "pins" from the "Arduino"
	var sync_pin = io_memory[5] >> 1 & 1;
	var video_pin = io_memory[11] >> 7 & 1;
	var data_index = 0;
	// Decide what to do
	if (sync_pin == 1)
	{
		// Ready to draw
		data_index = (96 * tv_y * 4) + (tv_x * 4);
		television_data.data[data_index] = 255 * video_pin;
		television_data.data[data_index + 1] = 255 * video_pin;
		television_data.data[data_index + 2] = 255 * video_pin;
		television_data.data[data_index + 3] = 255;
		tv_x = tv_x + 1;
		sync_ticks = 0;
	}
	
	else
	{
		// Video sync
		sync_ticks = sync_ticks + cycles;
		
		// Horizontal Sync
		tv_x = 0;
		
		// Vertical Sync
		if (sync_ticks > 9)
		{
			tv_y = 0;
			television_screen.putImageData(television_data,0,0);
			
		}

	}
	
} // end tv_advance_pixel()

function run_tv()
{
	tv_cycles = tv_cycles + 1;
	if (tv_cycles >= 8)
	{
		tv_advance_pixel();
		tv_cycles = 0;
	}
	
}// end run_tv()

function display_frame_buffer()
{
	var fb_addr_object = document.getElementById("fb_addr_label");
	var fb_addr = fb_addr_object.value;
	
	var j = 0;
	for(var i = 0; i < 4 * tv_x_resolution * tv_y_resolution; i+=32)
	{
		television_data.data[i] = 255 * (sram[fb_addr - 256 + j] >> 7 & 1);
		television_data.data[i+1] = 255 * (sram[fb_addr - 256 + j] >> 7 & 1);
		television_data.data[i+2] = 255 * (sram[fb_addr - 256 + j] >> 7 & 1);
		television_data.data[i+3] = 255;
		
		television_data.data[i+4] = 255 * (sram[fb_addr - 256 + j] >> 6 & 1);
		television_data.data[i+5] = 255 * (sram[fb_addr - 256 + j] >> 6 & 1);
		television_data.data[i+6] = 255 * (sram[fb_addr - 256 + j] >> 6 & 1);
		television_data.data[i+7] = 255;
		
		television_data.data[i+8] = 255 * (sram[fb_addr - 256 + j] >> 5 & 1);
		television_data.data[i+9] = 255 * (sram[fb_addr - 256 + j] >> 5 & 1);
		television_data.data[i+10] = 255 * (sram[fb_addr - 256 + j] >> 5 & 1);
		television_data.data[i+11] = 255;
		
		television_data.data[i+12] = 255 * (sram[fb_addr - 256 + j] >> 4 & 1);
		television_data.data[i+13] = 255 * (sram[fb_addr - 256 + j] >> 4 & 1);
		television_data.data[i+14] = 255 * (sram[fb_addr - 256 + j] >> 4 & 1);
		television_data.data[i+15] = 255;
		
		television_data.data[i+16] = 255 * (sram[fb_addr - 256 + j] >> 3 & 1);
		television_data.data[i+17] = 255 * (sram[fb_addr - 256 + j] >> 3 & 1);
		television_data.data[i+18] = 255 * (sram[fb_addr - 256 + j] >> 3 & 1);
		television_data.data[i+19] = 255;
		
		television_data.data[i+20] = 255 * (sram[fb_addr - 256 + j] >> 2 & 1);
		television_data.data[i+21] = 255 * (sram[fb_addr - 256 + j] >> 2 & 1);
		television_data.data[i+22] = 255 * (sram[fb_addr - 256 + j] >> 2 & 1);
		television_data.data[i+23] = 255;
		
		television_data.data[i+24] = 255 * (sram[fb_addr - 256 + j] >> 1 & 1);
		television_data.data[i+25] = 255 * (sram[fb_addr - 256 + j] >> 1 & 1);
		television_data.data[i+26] = 255 * (sram[fb_addr - 256 + j] >> 1 & 1);
		television_data.data[i+27] = 255;
		
		television_data.data[i+28] = 255 * (sram[fb_addr - 256 + j]  & 1);
		television_data.data[i+29] = 255 * (sram[fb_addr - 256 + j]  & 1);
		television_data.data[i+30] = 255 * (sram[fb_addr - 256 + j]  & 1);
		television_data.data[i+31] = 255;
		
		// Fetch the next byte from the "Arduino"
		j++;
	}
	
	television_screen.putImageData(television_data,0,0);
	big_screen_ctx.drawImage(television_object,0,0,4 * tv_x_resolution,4 * tv_y_resolution);
		
}

function display_permanent_frame_buffer()
{
	
	var fb_addr = permanent_fb_addr;
	var j = 0;
	for(var i = 0; i < 4 * tv_x_resolution * tv_y_resolution; i+=32)
	{
		television_data.data[i] = 255 * (sram[fb_addr - 256 + j] >> 7 & 1);
		television_data.data[i+1] = 255 * (sram[fb_addr - 256 + j] >> 7 & 1);
		television_data.data[i+2] = 255 * (sram[fb_addr - 256 + j] >> 7 & 1);
		television_data.data[i+3] = 255;
		
		television_data.data[i+4] = 255 * (sram[fb_addr - 256 + j] >> 6 & 1);
		television_data.data[i+5] = 255 * (sram[fb_addr - 256 + j] >> 6 & 1);
		television_data.data[i+6] = 255 * (sram[fb_addr - 256 + j] >> 6 & 1);
		television_data.data[i+7] = 255;
		
		television_data.data[i+8] = 255 * (sram[fb_addr - 256 + j] >> 5 & 1);
		television_data.data[i+9] = 255 * (sram[fb_addr - 256 + j] >> 5 & 1);
		television_data.data[i+10] = 255 * (sram[fb_addr - 256 + j] >> 5 & 1);
		television_data.data[i+11] = 255;
		
		television_data.data[i+12] = 255 * (sram[fb_addr - 256 + j] >> 4 & 1);
		television_data.data[i+13] = 255 * (sram[fb_addr - 256 + j] >> 4 & 1);
		television_data.data[i+14] = 255 * (sram[fb_addr - 256 + j] >> 4 & 1);
		television_data.data[i+15] = 255;
		
		television_data.data[i+16] = 255 * (sram[fb_addr - 256 + j] >> 3 & 1);
		television_data.data[i+17] = 255 * (sram[fb_addr - 256 + j] >> 3 & 1);
		television_data.data[i+18] = 255 * (sram[fb_addr - 256 + j] >> 3 & 1);
		television_data.data[i+19] = 255;
		
		television_data.data[i+20] = 255 * (sram[fb_addr - 256 + j] >> 2 & 1);
		television_data.data[i+21] = 255 * (sram[fb_addr - 256 + j] >> 2 & 1);
		television_data.data[i+22] = 255 * (sram[fb_addr - 256 + j] >> 2 & 1);
		television_data.data[i+23] = 255;
		
		television_data.data[i+24] = 255 * (sram[fb_addr - 256 + j] >> 1 & 1);
		television_data.data[i+25] = 255 * (sram[fb_addr - 256 + j] >> 1 & 1);
		television_data.data[i+26] = 255 * (sram[fb_addr - 256 + j] >> 1 & 1);
		television_data.data[i+27] = 255;
		
		television_data.data[i+28] = 255 * (sram[fb_addr - 256 + j]  & 1);
		television_data.data[i+29] = 255 * (sram[fb_addr - 256 + j]  & 1);
		television_data.data[i+30] = 255 * (sram[fb_addr - 256 + j]  & 1);
		television_data.data[i+31] = 255;
		
		// Fetch the next byte from the "Arduino"
		j++;
	}
	
	television_screen.putImageData(television_data,0,0);
	big_screen_ctx.drawImage(television_object,0,0,4 * tv_x_resolution,4 * tv_y_resolution);
		
}

function rx_hsync()
{
	//display_frame_buffer();
	tv_line_count++;
	if (tv_line_count > 96)
	{
		tv_line_count = 0;
		display_frame_buffer();
	}
} // end rx_hsync()
