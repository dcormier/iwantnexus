function checked_devices() {
	devices = [];
	$(".devices").filter(':checked').each(function(index, element) {
		devices.push($(element).val());
	});
	
	console.log(devices.length + ' devices checked');

	return devices;
}

$(function() {
	chrome.storage.sync.get(
		{
			api_key: '',
			devices: [],
			refresh_interval: 1000
		},
		function(items) {
			$("#api_key").val(items.api_key);
			$("#refresh_interval").val(items.refresh_interval);
			PushBullet.APIKey = items.api_key;

			console.log('Loaded ' + items.devices.length + ' saved devices.');

			load_devices(items.devices, true);
		}
	);
});

function load_devices(saved_devices, removeInvalidIds)
{	

	$("#devices").empty().append(
		$("<div>").append($("<small>").append("Loading devices from PushBullet..."))
	);

	PushBullet.devices(function(err, res) {
		if(err) {
			if (!err.error) {
				msg = err.response;
			}
			else {
				msg = err.error.message;
			}

			$("#devices").empty().append(
				$("<div>").append($("<small>").append("There was a problem. This might help: " + msg))
			);

			throw err.httpStatus + ' ' + msg;
		}
		else {
			$("#devices").empty().append(
				$("<div>").append($("<small>").append("To avoid a neverending loop, Chrome devices are not included."))
			);

			active_devices = res.devices.filter(filterOutInactiveDevices);
			non_chrome_devices = active_devices.filter(filterOutChromeDevices);
			
			if (non_chrome_devices.length > 0) {
				non_chrome_devices.sort(sortByDeviceNickname);

				$.each(non_chrome_devices, function(index, device) {
					if (device.kind === 'chrome') {
						return;
					}

					$("#devices").append(
						$("<div>").append(
							$("<input>").attr("type", "checkbox").addClass("devices").attr("id",device.iden).val(device.iden).prop('checked', saved_devices.indexOf(device.iden) !== -1)
						).append(
							$("<label>").attr("for",device.iden).append($('<strong>').append(device.nickname)).append('&nbsp;').append($('<small>').append('(' + device.model + ')'))
						)
					);
				});
			}
			else {
				if (active_devices.length > 0) {
					$("#devices").append($("<div>").append("<em>Only Chrome devices are registered with PushBullet! Pushing to those will result in an endless loop. You should <a href=\"https://www.pushbullet.com/apps\" target=\"_blank\">add PushBullet to your other devices</a>.</em>"));
				}
				else {
					$("#devices").append($("<div>").append("<em>No devices registered with PushBullet! You should <a href=\"https://www.pushbullet.com/apps\" target=\"_blank\">fix that</a>.</em>"));
				}
			}

			if (removeInvalidIds && saved_devices && saved_devices.length > 0) {
				console.log('Saving loaded, selected devices to remove any invalid device IDs');

				// Re-save the devices after loading to clean up any invalid device IDs that we had.
				chrome.storage.sync.set({
					devices: checked_devices()
				});
			}
		}
	});
}

function filterOutChromeDevices(device) {
	var isChrome = device.kind === 'chrome';

	if (isChrome) {
		console.log('Skipping Chrome device "' + device.nickname + '" (' + device.iden + ')');
	}

	return !isChrome;
}

function filterOutInactiveDevices(device) {
	return device.active;
}

function sortByDeviceNickname(a, b) {
	if (a.nickname > b.nickname) {
		return 1;
	}

	if (a.nickname < b.nickname) {
		return -1;
	}

	return 0;
}

$("#save").click(function(e) {
	console.log('Getting devices to save.');
	devices = checked_devices();
	api_key = $("#api_key").val();
	
	chrome.storage.sync.set({
		refresh_interval: $("#refresh_interval").val(),
		api_key: api_key,
		devices: devices
	});

	PushBullet.APIKey = api_key;
	load_devices(devices, false);
});

$("#test").click(function(e) {
	$.each(checked_devices(), function(index, device_iden) {
		PushBullet.push("link", device_iden, null, {title: "I got you a Nexus 6", url: "https://www.google.com/"});
	});
});
