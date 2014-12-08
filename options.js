function checked_devices() {
	devices = [];
	$('#devices .device > :checkbox').filter(':checked').each(function(index, device) {
		devices.push($(device).val());
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
	var div_devices = $("#devices");

	if (!PushBullet.APIKey) {
		div_devices.empty().append(
			$("<div>").addClass("loading").append($("<small>").append("Enter your Pushbullet Access Token above and click save to see devices to push notifications to."))
		);
		
		return;
	}

	div_devices.empty().append(
		$("<div>").addClass("loading").append($("<small>").append("Loading devices from PushBullet..."))
	);

	PushBullet.devices(function(err, res) {
		div_devices.empty();

		if(err) {
			if (!err.error) {
				msg = err.response;
			}
			else {
				msg = err.error.message;
			}

			div_devices.append(
				$("<div>").addClass("error").append($("<small>").append("There was a problem loading devices from PushBullet. This might help: " + msg))
			);

			throw err.httpStatus + ' ' + msg;
		}
		else {
			active_devices = res.devices.filter(filterOutInactiveDevices);
			
			if (active_devices.length > 0) {
				active_devices.sort(sortByDeviceNickname);

				var div_non_chrome = $("<div>").addClass("non_chrome");
				var div_chrome = $("<div>").addClass("chrome");

				div_chrome.append(
					$("<div>").append($("<small>").append("To avoid a neverending loop, only push to the following Chrome devices if you know exactly what you're doing."))
				);

				$.each(active_devices, function(index, device) {
					var checeked = saved_devices.indexOf(device.iden) !== -1;
					var device_node = buildDeviceNode(device, checeked);

					if (isChromeDevice(device)) {
						div_chrome.append(device_node);
					}
					else {
						div_non_chrome.append(device_node);	
					}
				});

				var non_chrome_count = div_non_chrome.find(".device").length;
				var chrome_count = div_chrome.find(".device").length

				if (non_chrome_count > 0) {
					div_devices.append(div_non_chrome);

					if (chrome_count > 0) {
						div_devices.append("<br>");
					}
				}

				if (chrome_count > 0) {
					div_devices.append(div_chrome);
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

function buildDeviceNode(device, checked) {
	var div_device = $("<div>").addClass("device").append(
		$("<input>").attr("type", "checkbox").attr("id",device.iden).val(device.iden).prop('checked', checked)
	).append(
		$("<label>").attr("for", device.iden).append($('<strong>').append(device.nickname)).append('&nbsp;').append($('<small>').append('(' + device.model + ')'))
	)

	return div_device;
}

function filterOutInactiveDevices(device) {
	return device.active;
}

function isChromeDevice(device) {
	var isChrome = device && device.kind === 'chrome';

	return isChrome;
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
	var msg = {
		title: "Test Push",
		url: "https://play.google.com/store/devices"
	};

	$.each(checked_devices(), function(index, device_iden) {
		PushBullet.push("link", device_iden, null, msg);
	});
});
