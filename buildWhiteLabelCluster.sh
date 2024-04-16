if [ -z "$1" ]; then
	echo "Error:- Missing number of containers to create as first parameter."

	exit
fi

containerCount=$(echo  "$1 + 0" | bc)
echo [$containerCount]

echo "Removing all containers..."
docker ps -aq | xargs docker stop | xargs docker rm
docker container prune --force

BASE_PORT_NUMBER=3000
# for i in {1..$containerCount..1}
for i in $(seq 1 1 $containerCount) 
do
	port=$(expr $BASE_PORT_NUMBER + $i)
	
	echo "Creating container $i at port $port in the background."
	
	docker container run -it -d -p $port:3000 --name wlblnode$i wlblnode npm run dev
done

# Input string to be split
input=$(ipconfig getiflist)
array=($input)
# read -a array <<< "$input"

# Iterate over the elements of the array
for element in "${array[@]}"
do
        ipAddress=$(ipconfig getifaddr $element)
        # echo "[$element] = [$ipAddress]"
        if [ -n "$ipAddress" ]; then
                break
        fi  
done

if [ -z "$ipAddress" ]; then
	echo "Unable to find the ip address."
	
	exit
fi

echo "Local IP Address is $ipAddress"
docker container run -it -d -p 80:80 -e HostIPAddress="$ipAddress" --name nginx1 wlblnginx systemctl start nginx

