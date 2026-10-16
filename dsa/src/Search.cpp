
#include "../include/Train.h"
#include "../include/Station.h"

#include <algorithm>
#include <cctype>
#include <string>
#include <vector>

using namespace std;

// Convert text to lowercase for case-insensitive search.
string toLowerCase(string text) {
    transform(
        text.begin(),
        text.end(),
        text.begin(),
        [](unsigned char ch) {
            return static_cast<char>(tolower(ch));
        }
    );

    return text;
}

// Linear Search: find a train by number.
// Time Complexity: O(n)
int linearSearchTrain(
    const vector<Train>& trains,
    const string& trainNumber
) {
    for (size_t i = 0; i < trains.size(); i++) {
        if (trains[i].getTrainNumber() == trainNumber) {
            return static_cast<int>(i);
        }
    }

    return -1;
}

// Linear Search: find trains by source and destination.
// Time Complexity: O(n)
vector<int> searchTrainsByRoute(
    const vector<Train>& trains,
    const string& source,
    const string& destination
) {
    vector<int> results;

    string searchSource = toLowerCase(source);
    string searchDestination = toLowerCase(destination);

    for (size_t i = 0; i < trains.size(); i++) {
        if (
            toLowerCase(trains[i].getSource()) == searchSource &&
            toLowerCase(trains[i].getDestination()) ==
                searchDestination
        ) {
            results.push_back(static_cast<int>(i));
        }
    }

    return results;
}

// Binary Search: train numbers must be sorted in ascending order.
// Time Complexity: O(log n)
int binarySearchTrain(
    const vector<Train>& trains,
    const string& trainNumber
) {
    int left = 0;
    int right = static_cast<int>(trains.size()) - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        string currentNumber = trains[mid].getTrainNumber();

        if (currentNumber == trainNumber) {
            return mid;
        }

        if (currentNumber < trainNumber) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}

// Linear Search: find a station by code.
// Time Complexity: O(n)
int linearSearchStation(
    const vector<Station>& stations,
    const string& stationCode
) {
    string target = toLowerCase(stationCode);

    for (size_t i = 0; i < stations.size(); i++) {
        if (toLowerCase(stations[i].getCode()) == target) {
            return static_cast<int>(i);
        }
    }

    return -1;
}

// Linear Search: find a station by name or city.
// Time Complexity: O(n)
vector<int> searchStationsByName(
    const vector<Station>& stations,
    const string& query
) {
    vector<int> results;
    string target = toLowerCase(query);

    for (size_t i = 0; i < stations.size(); i++) {
        string name = toLowerCase(stations[i].getName());
        string city = toLowerCase(stations[i].getCity());
        string code = toLowerCase(stations[i].getCode());

        if (
            name.find(target) != string::npos ||
            city.find(target) != string::npos ||
            code.find(target) != string::npos
        ) {
            results.push_back(static_cast<int>(i));
        }
    }

    return results;
}
