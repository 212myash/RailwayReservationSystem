
#include "../include/Train.h"

#include <string>
#include <vector>

using namespace std;

// Bubble Sort by train number.
// Time Complexity: O(n^2)
// Auxiliary Space: O(1), excluding the input vector.
void bubbleSortTrainsByNumber(vector<Train>& trains) {
    int n = static_cast<int>(trains.size());

    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;

        for (int j = 0; j < n - i - 1; j++) {
            if (
                trains[j].getTrainNumber() >
                trains[j + 1].getTrainNumber()
            ) {
                Train temp = trains[j];
                trains[j] = trains[j + 1];
                trains[j + 1] = temp;

                swapped = true;
            }
        }

        if (!swapped) {
            break;
        }
    }
}

// Insertion Sort by fare.
// Time Complexity: O(n^2) worst case.
// Auxiliary Space: O(1), excluding the input vector.
void insertionSortTrainsByFare(vector<Train>& trains) {
    int n = static_cast<int>(trains.size());

    for (int i = 1; i < n; i++) {
        Train key = trains[i];
        int j = i - 1;

        while (
            j >= 0 &&
            trains[j].getFare() > key.getFare()
        ) {
            trains[j + 1] = trains[j];
            j--;
        }

        trains[j + 1] = key;
    }
}
